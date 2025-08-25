// Sample data for testing - fallback when CSV loading fails
// This data is based on the actual CSV structure we saw earlier

import type { Donor, ContributorType } from '../types/donor';

export const sampleDonors: Donor[] = [
  {
    NAME: "University of Padua",
    TYPE: "0",
    "CEB CODE": "UNIPD",
    "CONTRIBUTOR TYPE": "C07"
  },
  {
    NAME: "Raoul Wallenberg center of human rights",
    TYPE: "0", 
    "CEB CODE": "RWCHR",
    "CONTRIBUTOR TYPE": "C02"
  },
  {
    NAME: "Euregio platform for human dignity and human rights",
    TYPE: "0",
    "CEB CODE": "EUPHUR", 
    "CONTRIBUTOR TYPE": "C07"
  },
  {
    NAME: "Tetsuko Kuroyanagi",
    TYPE: "0",
    "CEB CODE": "TETSUKOK",
    "CONTRIBUTOR TYPE": "C06"
  },
  {
    NAME: "UNICEF - KAZAKHSTAN",
    TYPE: "0",
    "CEB CODE": "KZH-UNICEF",
    "CONTRIBUTOR TYPE": "C02"
  },
  {
    NAME: "UNICEF Bulgaria",
    TYPE: "0",
    "CEB CODE": "BUG-UNICEF",
    "CONTRIBUTOR TYPE": "C02"
  },
  {
    NAME: "UNICEF Greece",
    TYPE: "0",
    "CEB CODE": "GRE-UNICEF", 
    "CONTRIBUTOR TYPE": "C02"
  },
  {
    NAME: "South Africa",
    TYPE: "1",
    "CEB CODE": "ZA",
    "CONTRIBUTOR TYPE": "C01"
  },
  {
    NAME: "Switzerland",
    TYPE: "1", 
    "CEB CODE": "CH",
    "CONTRIBUTOR TYPE": "C01"
  },
  {
    NAME: "GATES VENTURES",
    TYPE: "0",
    "CEB CODE": "GATESV",
    "CONTRIBUTOR TYPE": "C05"
  },
  {
    NAME: "World Bank",
    TYPE: "0",
    "CEB CODE": "WORLDBANK",
    "CONTRIBUTOR TYPE": "C04A"
  },
  {
    NAME: "Global Fund to Fight AIDS",
    TYPE: "0",
    "CEB CODE": "GFATM",
    "CONTRIBUTOR TYPE": "C04B"
  }
];

export const sampleContributorTypes: ContributorType[] = [
  {
    NAME: "Government",
    TYPE: "C01",
    DEFINITION: "Includes: Local Government - Any local (sub national) government organisation in either contributor or recipient country. Other Public Sector – Any other public sector organization falling within the government"
  },
  {
    NAME: "NGOs", 
    TYPE: "C02",
    DEFINITION: "Non-governmental organizations that can include: International NGO - An international non-governmental organization (INGO) is international in scope and has outposts around the world to deal with specific issues in many countries. National NGO – A non-government organization with a scope to deal with specific issues in a particular country. Regional NGO - A non-government organization with a scope to deal with specific issues in a particular region. Partner Country based NGO - NGOs not based in an aid recipient country and carrying out operations in one or more aid recipient countries."
  },
  {
    NAME: "Public Private Partnership",
    TYPE: "C03", 
    DEFINITION: "A public–private partnership (PPP, 3P or P3) is a cooperative arrangement between two or more public and private sectors, typically of a long-term nature"
  },
  {
    NAME: "Foundations",
    TYPE: "C05",
    DEFINITION: "A foundation is a non-governmental entity that is established as a nonprofit corporation or a charitable trust, with a principal purpose of making grants to unrelated organizations, institutions, or individuals for scientific, educational, cultural, religious, or other charitable purposes. This broad DEFINITION encompasses two foundation types: private foundations and grantmaking public charities"
  },
  {
    NAME: "Private Sector",
    TYPE: "C06", 
    DEFINITION: "The private sector is the part of the economy, sometimes referred to as the citizen sector, which is run by private individuals or groups, usually as a means of enterprise for profit, and is not controlled by the State"
  },
  {
    NAME: "Academic, Training and Research",
    TYPE: "C07",
    DEFINITION: "Contributions from institutions whose main purpose is academic, training and research"
  },
  {
    NAME: "Multilateral - International Financial Institutions", 
    TYPE: "C04A",
    DEFINITION: "Such as the World Bank, IMF and regional Development Banks"
  },
  {
    NAME: "Multilateral - Global vertical funds",
    TYPE: "C04B", 
    DEFINITION: "Global vertical funds focus 'vertically' on specific themes, but are not directly administered by a UN entity and do not have a UN lead role in the fund allocation process. Though a form of pooled funding, from the UN perspective the funding received is earmarked to particular projects, with the UN's role solely as a fund implementer. Examples include Global Climate Fund, GEF, GFATM, Montreal Protocol, GAVI"
  }
];
