import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Card, CardContent,
  Alert, CircularProgress, Collapse, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Checkbox, FormControlLabel, Switch,
  Select, MenuItem, FormControl,
} from '@mui/material';
import {
  ContentCopy, ExpandMore, ExpandLess, Search,
  CheckCircle, Warning, HelpOutline, Download, Stop,
} from '@mui/icons-material';
import Fuse from 'fuse.js';
import { useAppData } from '../hooks/useAppData';
import { loadLlmConfig, saveLlmConfig, callLlm } from '../services/llmService';
import { CodeGenerationService } from '../services/codeGenerationService';
import type { LlmConfig } from '../services/llmService';
import type { DonorWithType, ContributorType } from '../types/donor';

interface ParsedCode {
  raw: string;
  name?: string;
  status: 'exact' | 'fuzzy' | 'unknown';
  exists: boolean;
  match?: DonorWithType;
  score?: number;
  llmResult?: {
    organization: string;
    contributorType: string;
    reason: string;
    confirmed: boolean;
  };
  generatedCodes?: string[];
}

const TYPE_MAP: Record<string, string> = {
  C01: 'Government',
  C02: 'NGOs',
  C03: 'Public Private Partnership',
  C04A: 'Multilateral - International Financial Institutions',
  C04B: 'Multilateral - Global vertical funds',
  C05: 'Foundations',
  C06: 'Private Sector',
  C07: 'Academic, Training and Research',
};

export default function ContributorToolPage() {
  const { donorsWithTypes, contributorTypes, loading } = useAppData();
  const [config, setConfig] = useState<LlmConfig>(loadLlmConfig);
  const [showConfig, setShowConfig] = useState(false);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<ParsedCode[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [querying, setQuerying] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'exact' | 'fuzzy' | 'unknown'>('all');
  const [selectedContributorTypes, setSelectedContributorTypes] = useState<Map<number, string>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const stopQueries = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setQuerying(new Set());
  }, []);

  const fuse = useMemo(() => {
    if (donorsWithTypes.length === 0) return null;
    return new Fuse(donorsWithTypes, {
      keys: ['CEB CODE', 'NAME'],
      threshold: 0.2,
      includeScore: true,
    });
  }, [donorsWithTypes]);

  const contributorTypesByCode = useMemo(() => {
    const map = new Map<string, ContributorType>();
    contributorTypes.forEach(t => map.set(t.TYPE, t));
    return map;
  }, [contributorTypes]);

  useEffect(() => {
    saveLlmConfig(config);
  }, [config]);

  const handleValidate = () => {
    if (!fuse) return;
    const lines = input.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const codeGenService = new CodeGenerationService(donorsWithTypes);

    const parsed: ParsedCode[] = lines.map(line => {
      const parts = line.split(/[\t,]+/).map(p => p.trim());
      const raw = parts[0];
      const name = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
      const upper = raw.toUpperCase();

      const exact = donorsWithTypes.find(d => d['CEB CODE'].toUpperCase() === upper);
      if (exact) return { raw, name, status: 'exact', exists: true, match: exact, score: 1 };

      const fuseResults = fuse.search(raw);
      if (fuseResults.length > 0 && fuseResults[0].score !== undefined && fuseResults[0].score < 0.2) {
        const matchedItem = fuseResults[0].item;
        const score = 1 - fuseResults[0].score;
        
        return { raw, name, status: 'fuzzy', exists: true, match: matchedItem, score };
      }

      const entityName = name || raw;
      const codeResult = codeGenService.generateCode({
        entityName,
        maxSuggestions: 3,
      });
      
      const generatedCodes = [
        codeResult.primary.code,
        ...codeResult.alternatives.map(alt => alt.code),
      ];

      return { raw, name, status: 'unknown', exists: false, generatedCodes };
    });

    setResults(parsed);
    setSelected(new Set());
  };

  const handleLlmQuery = async (parsedCode: ParsedCode) => {
    if (!abortRef.current) abortRef.current = new AbortController();
    setQuerying(prev => new Set(prev).add(parsedCode.raw));

    const typesDescription = Object.entries(TYPE_MAP)
      .map(([k, v]) => `- ${k} — ${v}`)
      .join('\n');

    let prompt: string;
    const nameInfo = parsedCode.name ? ` The organization name provided is: "${parsedCode.name}".` : '';
    
    if (parsedCode.match) {
      const matchScore = parsedCode.score ? Math.round(parsedCode.score * 100) : 'N/A';
      const matchType = parsedCode.match.contributorTypeInfo 
        ? `${parsedCode.match['CONTRIBUTOR TYPE']} — ${parsedCode.match.contributorTypeInfo.NAME}` 
        : parsedCode.match['CONTRIBUTOR TYPE'];
      
      prompt = `I have a donor code "${parsedCode.raw}" that might match an existing code in our database.

Potential match found:
- Code: "${parsedCode.match['CEB CODE']}"
- Organization: "${parsedCode.match.NAME}"
- Current contributor type: ${matchType}
- Match confidence: ${matchScore}%
${parsedCode.name ? `- User provided name: "${parsedCode.name}"` : ''}

Please search the web to verify:
1. Is this the same organization? (confirmed: true/false)
2. Is the current contributor type "${matchType}" correct for this organization?

Available contributor types for reference:
${typesDescription}

Respond in JSON format only:
{
  "organization": "Full name of the organization",
  "contributorType": "Keep the current type code if correct, otherwise the correct type code",
  "reason": "Brief explanation including the organization type",
  "confirmed": true if the code matches the existing entry, false if it's a different organization
}`;
    } else {
      prompt = `I have a donor code "${parsedCode.raw}" that I need to identify. This code does not match any existing code in our database.${nameInfo}

Please search the web to identify what organization, company, or entity this code likely refers to.

Determine the appropriate contributor type from this list:
${typesDescription}

Respond in JSON format only:
{
  "organization": "Full name of the organization",
  "contributorType": "Type code (e.g. C01, C02) — Type name",
  "reason": "Brief explanation including the organization type",
  "confirmed": false
}`;
    }

    try {
      const response = await callLlm(config, prompt, abortRef.current.signal);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const llmResult = JSON.parse(jsonMatch[0]);
        
        const codeGenService = new CodeGenerationService(donorsWithTypes);
        const codeResult = codeGenService.generateCode({
          entityName: llmResult.organization,
          contributorType: llmResult.contributorType,
          maxSuggestions: 3,
        });
        
        const generatedCodes = [
          codeResult.primary.code,
          ...codeResult.alternatives.map(alt => alt.code),
        ];

        const newStatus = llmResult.confirmed ? parsedCode.status : 'unknown';
        const newExists = llmResult.confirmed;
        
        const newContributorType = llmResult.contributorType.includes(' — ')
          ? llmResult.contributorType.split(' — ')[0]
          : llmResult.contributorType;
        
        setResults(prev => prev.map(r =>
          r.raw === parsedCode.raw ? { 
            ...r, 
            llmResult, 
            generatedCodes,
            status: newStatus,
            exists: newExists,
          } : r
        ));

        const index = results.findIndex(r => r.raw === parsedCode.raw);
        if (index !== -1) {
          setSelectedContributorTypes(prev => {
            const next = new Map(prev);
            next.set(index, newContributorType);
            return next;
          });
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('LLM error:', err);
    } finally {
      setQuerying(prev => {
        const next = new Set(prev);
        next.delete(parsedCode.raw);
        if (next.size === 0) abortRef.current = null;
        return next;
      });
    }
  };

  const handleBulkLlm = async () => {
    const ambiguous = results.filter(r =>
      (r.status === 'fuzzy' || r.status === 'unknown') && !r.llmResult
    );
    for (const r of ambiguous) {
      await handleLlmQuery(r);
    }
  };

  const toggleSelect = (index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleContributorTypeChange = (index: number, value: string) => {
    setSelectedContributorTypes(prev => {
      const next = new Map(prev);
      next.set(index, value);
      return next;
    });
  };

  const getContributorType = (index: number, r: ParsedCode): string => {
    if (selectedContributorTypes.has(index)) {
      return selectedContributorTypes.get(index)!;
    }
    if (r.llmResult) {
      return r.llmResult.contributorType.includes(' — ')
        ? r.llmResult.contributorType.split(' — ')[0]
        : r.llmResult.contributorType;
    }
    if (r.match) {
      return r.match['CONTRIBUTOR TYPE'];
    }
    return '';
  };

  const toggleAll = () => {
    const filtered = results
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => statusFilter === 'all' || r.status === statusFilter);

    if (filtered.every(({ i }) => selected.has(i))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(({ i }) => i)));
    }
  };

  const generateCsv = () => {
    const selectedResults = results.filter((_, i) => selected.has(i));
    if (selectedResults.length === 0) return;

    const header = 'NAME\tCEB CODE\tCONTRIBUTOR TYPE';
    const rows = selectedResults.map(r => {
      const actualIndex = results.indexOf(r);
      const contributorType = getContributorType(actualIndex, r);
      
      if (r.llmResult) {
        const code = r.generatedCodes && r.generatedCodes.length > 0 
          ? r.generatedCodes[0] 
          : r.raw;
        return [
          r.llmResult.organization,
          code,
          contributorType,
        ].join('\t');
      }
      if (r.match) {
        return [
          r.match.NAME,
          r.match['CEB CODE'],
          contributorType,
        ].join('\t');
      }
      return [
        'Unknown',
        r.raw,
        contributorType,
      ].join('\t');
    });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donors-import-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCsv = () => {
    const selectedResults = results.filter((_, i) => selected.has(i));
    if (selectedResults.length === 0) return;

    const header = 'NAME\tCEB CODE\tCONTRIBUTOR TYPE';
    const rows = selectedResults.map(r => {
      const actualIndex = results.indexOf(r);
      const contributorType = getContributorType(actualIndex, r);
      
      if (r.llmResult) {
        const code = r.generatedCodes && r.generatedCodes.length > 0 
          ? r.generatedCodes[0] 
          : r.raw;
        return [
          r.llmResult.organization,
          code,
          contributorType,
        ].join('\t');
      }
      if (r.match) {
        return [
          r.match.NAME,
          r.match['CEB CODE'],
          contributorType,
        ].join('\t');
      }
      return [
        'Unknown',
        r.raw,
        contributorType,
      ].join('\t');
    });

    const csv = [header, ...rows].join('\n');
    navigator.clipboard.writeText(csv);
  };

  const filteredResults = results
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => statusFilter === 'all' || r.status === statusFilter);

  const counts = {
    all: results.length,
    exact: results.filter(r => r.status === 'exact').length,
    fuzzy: results.filter(r => r.status === 'fuzzy').length,
    unknown: results.filter(r => r.status === 'unknown').length,
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Contributor Tool
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Paste donor codes to match against the existing database.
        Ambiguous codes can be resolved via LLM.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">LLM Configuration</Typography>
            <IconButton size="small" onClick={() => setShowConfig(!showConfig)}>
              {showConfig ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          <Collapse in={showConfig}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexDirection: 'column' }}>
              <TextField
                label="API Key"
                type="password"
                size="small"
                fullWidth
                value={config.apiKey}
                onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
                placeholder="gsk_..."
              />
              <Typography variant="caption">
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
                  Get your free API key at console.groq.com
                </a>
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Base URL"
                  size="small"
                  fullWidth
                  value={config.baseUrl}
                  onChange={e => setConfig(c => ({ ...c, baseUrl: e.target.value }))}
                />
                <TextField
                  label="Model"
                  size="small"
                  fullWidth
                  value={config.model}
                  onChange={e => setConfig(c => ({ ...c, model: e.target.value }))}
                />
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      <TextField
        multiline
        minRows={4}
        fullWidth
        placeholder="Paste codes here, one per line. Optional: add org name with tab or comma (e.g. CONTINE, CONTINENTAL REINSURANCE PLC)"
        value={input}
        onChange={e => setInput(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <Search />}
          onClick={handleValidate}
          disabled={loading || !input.trim()}
        >
          Validate Codes
        </Button>
        {results.length > 0 && (
          <>
            <Button
              variant="outlined"
              onClick={handleBulkLlm}
              disabled={!config.apiKey || querying.size > 0}
            >
              {querying.size > 0 ? `Querying... (${querying.size})` : 'Resolve via LLM'}
            </Button>
            {querying.size > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Stop />}
                onClick={stopQueries}
              >
                Stop
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={copyCsv}
              disabled={selected.size === 0}
            >
              Copy CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={generateCsv}
              disabled={selected.size === 0}
            >
              Download CSV
            </Button>
          </>
        )}
      </Box>

      {!config.apiKey && showConfig && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Set an API key to enable LLM resolution for ambiguous codes.
          You can use Groq (free), OpenAI, or any OpenAI-compatible API.
        </Alert>
      )}

      {results.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ mr: 1 }}>Filter:</Typography>
            {(['all', 'exact', 'fuzzy', 'unknown'] as const).map(f => (
              <Chip
                key={f}
                label={`${f} (${counts[f]})`}
                onClick={() => setStatusFilter(f)}
                color={statusFilter === f ? 'primary' : 'default'}
                variant={statusFilter === f ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
            <Box sx={{ ml: 'auto' }}>
              <FormControlLabel
                control={<Switch size="small" checked={filteredResults.every(({ i }) => selected.has(i))} onChange={toggleAll} />}
                label={`Select all (${filteredResults.length})`}
              />
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Table size="small" sx={{ '& .MuiTableCell-body': { border: '1px solid #f0f0f0' } }}>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-head': { backgroundColor: '#f5f5f5', color: '#333', fontWeight: 600 } }}>
                  <TableCell padding="checkbox" />
                  <TableCell>Code</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Match / Organization</TableCell>
                  <TableCell>Contributor Type</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ '& .MuiTableRow-root:nth-of-type(odd)': { backgroundColor: '#f0f7fc' } }}>
                {filteredResults.map(({ r, i }) => (
                  <TableRow key={i} hover selected={selected.has(i)}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected.has(i)} onChange={() => toggleSelect(i)} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={r.status === 'exact' ? <CheckCircle /> : r.status === 'fuzzy' ? <Warning /> : <HelpOutline />}
                        label={r.raw}
                        size="small"
                        color={r.status === 'exact' ? 'success' : r.status === 'fuzzy' ? 'warning' : 'default'}
                        variant="outlined"
                      />
                      {r.name && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {r.name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.status === 'exact' ? 'Exists' : r.status === 'fuzzy' ? 'Match' : 'New'}
                        size="small"
                        color={r.status === 'exact' ? 'info' : r.status === 'fuzzy' ? 'warning' : 'success'}
                        variant="filled"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      {r.llmResult ? (
                        <Box>
                          <Typography variant="body2">{r.llmResult.organization}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.llmResult.reason}</Typography>
                          {r.generatedCodes && r.generatedCodes.length > 0 && (
                            <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {r.generatedCodes.map((code, idx) => (
                                <Chip
                                  key={idx}
                                  label={code}
                                  size="small"
                                  color={idx === 0 ? 'primary' : 'default'}
                                  variant={idx === 0 ? 'filled' : 'outlined'}
                                  sx={{ fontWeight: 500 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      ) : r.match ? (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Name: {r.match.NAME}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Code: {r.match['CEB CODE']}
                          </Typography>
                        </Box>
                      ) : r.generatedCodes && r.generatedCodes.length > 0 ? (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Proposed codes:
                          </Typography>
                          <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {r.generatedCodes.map((code, idx) => (
                              <Chip
                                key={idx}
                                label={code}
                                size="small"
                                color={idx === 0 ? 'primary' : 'default'}
                                variant={idx === 0 ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 500 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={getContributorType(i, r)}
                          onChange={(e) => handleContributorTypeChange(i, e.target.value)}
                          variant="standard"
                          displayEmpty
                          renderValue={(value) => value || <span style={{ color: '#999' }}>Please select</span>}
                        >
                          {Object.entries(TYPE_MAP).map(([code, name]) => (
                            <MenuItem key={code} value={code}>
                              {code} — {name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {r.score !== undefined && (
                        <Typography variant="body2">
                          {Math.round(r.score * 100)}%
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleLlmQuery(r)}
                        disabled={!config.apiKey || querying.has(r.raw)}
                      >
                        {querying.has(r.raw) ? <CircularProgress size={14} /> : 'Resolve'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
