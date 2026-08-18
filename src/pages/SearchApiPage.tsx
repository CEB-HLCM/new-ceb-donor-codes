import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchService, SearchType, SearchField } from '../services/searchService';
import { useAppData } from '../hooks/useAppData';

interface ApiSearchResult {
  code: string;
  query: string;
  matches: Array<{
    NAME: string;
    'CEB CODE': string;
    TYPE: string;
    'CONTRIBUTOR TYPE': string;
    contributorTypeInfo?: {
      NAME: string;
      TYPE: string;
      DEFINITION: string;
    };
    score: number;
  }>;
}

interface ApiResponse {
  success: boolean;
  data?: ApiSearchResult[];
  error?: string;
  timestamp: string;
}

export default function SearchApiPage() {
  const [searchParams] = useSearchParams();
  const { donorsWithTypes, loading, error: dataError } = useAppData();
  const [response, setResponse] = useState<ApiResponse | null>(null);

  useEffect(() => {
    if (loading) return;

    if (dataError) {
      setResponse({
        success: false,
        error: dataError,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const codesParam = searchParams.get('codes');

    if (!codesParam) {
      setResponse({
        success: false,
        error: 'Missing "codes" parameter. Use ?codes=CODE1,CODE2&threshold=0.4',
        documentation: {
          description: 'Search CEB donor codes and return matching candidates with a score.',
          parameters: {
            codes: 'Comma-separated list of donor codes to search (required)',
            threshold: 'Fuzzy matching threshold from 0 (strict) to 1 (permissive). Default: 0.4'
          },
          example: '/api/search?codes=UNIPD,CH&threshold=0.3'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const codes = codesParam.split(',').map(c => c.trim()).filter(c => c.length > 0);

    if (codes.length === 0) {
      setResponse({
        success: false,
        error: 'No valid codes provided',
        timestamp: new Date().toISOString()
      });
      return;
    }

    searchService.updateData(donorsWithTypes);

    const thresholdParam = searchParams.get('threshold');
    const threshold = thresholdParam ? Math.min(1, Math.max(0, parseFloat(thresholdParam))) : 0.4;

    const results: ApiSearchResult[] = codes.map(code => {
      const searchResult = searchService.search(code, {
        searchType: SearchType.EXACT,
        searchField: SearchField.CEB_CODE,
        maxResults: 10
      });

      const fuzzyResult = searchResult.results.length === 0
        ? searchService.search(code, {
            searchType: SearchType.FUZZY,
            searchField: SearchField.CEB_CODE,
            fuzzyThreshold: threshold,
            maxResults: 10
          })
        : searchResult;

      return {
        code,
        query: code,
        matches: fuzzyResult.results.map(r => ({
          NAME: r.item.NAME,
          'CEB CODE': r.item['CEB CODE'],
          TYPE: r.item.TYPE,
          'CONTRIBUTOR TYPE': r.item['CONTRIBUTOR TYPE'],
          contributorTypeInfo: r.item.contributorTypeInfo,
          score: Math.round((r.score ?? 0) * 100)
        }))
      };
    });

    setResponse({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  }, [searchParams, donorsWithTypes, loading, dataError]);

  useEffect(() => {
    if (response) {
      document.body.innerText = JSON.stringify(response, null, 2);
      document.body.style.fontFamily = 'monospace';
      document.body.style.whiteSpace = 'pre-wrap';
    }
  }, [response]);

  if (loading) {
    return <div style={{ fontFamily: 'monospace', padding: '20px' }}>Loading...</div>;
  }

  return null;
}
