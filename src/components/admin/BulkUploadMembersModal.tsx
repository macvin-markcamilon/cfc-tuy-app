'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  X,
  FileText,
  Trash2,
  UserCheck,
  Building,
  MapPin,
  RefreshCw,
  Check,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { DirectoryCouple, MinistryType, UserProfile, HouseholdGroup } from '@/types';
import { saveDirectoryCouplesBulk } from '@/lib/data/members-service';
import { saveUsersBulk } from '@/lib/data/user-service';
import { TUY_BARANGAYS } from '@/lib/data/mock-data';

interface BulkUploadMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCouples: DirectoryCouple[], createdUsersCount: number) => void;
  householdGroups?: HouseholdGroup[];
}

export interface ParsedMemberRow {
  index: number;
  couple: Partial<DirectoryCouple>;
  rowStatus: 'valid' | 'warning' | 'error';
  validationMessage: string;
  isSingleMember: boolean;
}

const SAMPLE_CSV_CONTENT = `Husband First Name,Husband Last Name,Husband Nickname,Husband Contact,Husband Email,Husband Birthday,Husband Occupation,Wife First Name,Wife Last Name,Wife Nickname,Wife Contact,Wife Email,Wife Birthday,Wife Occupation,Wedding Anniversary,Ministry,Barangay,Address,Household Group,Status,Notes
Juan,Dela Cruz,Johnny,09171234567,juan.delacruz@example.com,1985-05-15,Engineer,Maria,Dela Cruz,Mar,09189876543,maria.delacruz@example.com,1988-08-20,Teacher,2010-12-18,CFC,Rizal (Pob.),Brgy. Rizal,Unit 1 Household A,Active,Active CLP Batch 28 Graduates
Mark,Hernandez,Macmac,09223334444,mark.hernandez@example.com,1996-03-10,IT Specialist,,,,,,,,SFC,Luna (Pob.),Brgy. Luna,SFC Tuy Chapter,Active,Chapter Youth Leader
Teresa,Mendoza,Tess,09195556666,teresa.mendoza@example.com,1965-11-04,Business Owner,,,,,,,,HOLD,Burgos (Pob.),Brgy. Burgos,HOLD Circle 2,Active,Handmaids Servant
`;

export default function BulkUploadMembersModal({
  isOpen,
  onClose,
  onImportSuccess,
  householdGroups = [],
}: BulkUploadMembersModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');

  // Options
  const [createAccounts, setCreateAccounts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState<{ total: number; couples: number; users: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filtered rows for display in table
  const displayedRows = useMemo(() => {
    if (filterStatus === 'all') return parsedRows;
    return parsedRows.filter((r) => r.rowStatus === filterStatus);
  }, [parsedRows, filterStatus]);

  // Stat Counters
  const counts = useMemo(() => {
    const total = parsedRows.length;
    const valid = parsedRows.filter((r) => r.rowStatus === 'valid').length;
    const warning = parsedRows.filter((r) => r.rowStatus === 'warning').length;
    const error = parsedRows.filter((r) => r.rowStatus === 'error').length;
    return { total, valid, warning, error };
  }, [parsedRows]);

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // CSV Download Handler
  // ---------------------------------------------------------------------------
  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cfc_tuy_members_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // CSV Parser Utility
  // ---------------------------------------------------------------------------
  const parseCSVData = (rawText: string) => {
    setErrorMsg(null);
    const trimmed = rawText.replace(/^\uFEFF/, '').trim();
    if (!trimmed) {
      setErrorMsg('The CSV file or text content appears to be empty.');
      return;
    }

    // Split rows handling quoted newlines
    const lines: string[] = [];
    let currentLine = '';
    let insideQuotes = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
        currentLine += char;
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && trimmed[i + 1] === '\n') {
          i++; // Skip \n after \r
        }
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    if (lines.length < 2) {
      setErrorMsg('CSV must contain a header row and at least one data row.');
      return;
    }

    // Tokenizer for CSV fields
    const parseCSVRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let currentVal = '';
      let inQuotes = false;

      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"') {
          if (inQuotes && rowStr[i + 1] === '"') {
            currentVal += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if ((char === ',' || char === '\t') && !inQuotes) {
          result.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      result.push(currentVal.trim());
      return result;
    };

    const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows = lines.slice(1);

    const parsedResults: ParsedMemberRow[] = [];
    const validIndices = new Set<number>();

    rows.forEach((rowStr, idx) => {
      if (!rowStr.trim()) return;
      const cells = parseCSVRow(rowStr);

      const getVal = (...keys: string[]): string => {
        for (const key of keys) {
          const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          const colIdx = headers.indexOf(normKey);
          if (colIdx !== -1 && cells[colIdx]) {
            return cells[colIdx].trim();
          }
        }
        return '';
      };

      // Extract husband / primary fields
      const husbandFirst = getVal('husbandfirstname', 'husbandfirst', 'firstname', 'first', 'husbandname', 'husband');
      const husbandLast = getVal('husbandlastname', 'husbandlast', 'lastname', 'last', 'surname');
      const husbandNick = getVal('husbandnickname', 'nickname');
      const husbandContact = getVal('husbandcontact', 'husbandphone', 'contact', 'phone', 'mobile');
      const husbandEmail = getVal('husbandemail', 'email');
      const husbandBday = getVal('husbandbirthday', 'husbandbday', 'birthday', 'bday');
      const husbandJob = getVal('husbandoccupation', 'husbandjob', 'occupation', 'job');

      // Extract wife / secondary fields
      const wifeFirst = getVal('wifefirstname', 'wifefirst', 'wifename');
      const wifeLast = getVal('wifelastname', 'wifelast');
      const wifeNick = getVal('wifenickname');
      const wifeContact = getVal('wifecontact', 'wifephone');
      const wifeEmail = getVal('wifeemail');
      const wifeBday = getVal('wifebirthday', 'wifebday');
      const wifeJob = getVal('wifeoccupation', 'wifejob');

      // Couple / Household fields
      const weddingAnniv = getVal('weddinganniversary', 'anniversary', 'anniv');
      const rawMinistry = getVal('ministry', 'family_ministry', 'ministrytype').toUpperCase();
      const rawBarangay = getVal('barangay', 'brgy', 'baranggay');
      const address = getVal('address', 'street', 'location');
      const householdGroupName = getVal('householdgroupname', 'householdgroup', 'household', 'group');
      const rawStatus = getVal('status', 'memberstatus');
      const notes = getVal('notes', 'remarks', 'comments');

      // Validate & Normalize Ministry
      let ministry: MinistryType = 'CFC';
      if (['CFC', 'SFC', 'YFC', 'KFC', 'HOLD', 'SOLD'].includes(rawMinistry)) {
        ministry = rawMinistry as MinistryType;
      }

      // Validate & Normalize Status
      let status: DirectoryCouple['status'] = 'Active';
      const normStat = rawStatus.toLowerCase();
      if (normStat.includes('break')) status = 'On-Break';
      else if (normStat.includes('transfer')) status = 'Transferred';
      else if (normStat.includes('inact')) status = 'Inactive';
      else if (normStat.includes('act')) status = 'Active';

      // Validate Barangay against Tuy list
      let barangay = 'Rizal (Pob.)';
      if (rawBarangay) {
        const matchedBrgy = TUY_BARANGAYS.find(
          (b) => b.toLowerCase() === rawBarangay.toLowerCase() || b.toLowerCase().includes(rawBarangay.toLowerCase())
        );
        if (matchedBrgy) barangay = matchedBrgy;
        else barangay = rawBarangay;
      }

      // Determine single vs couple
      const isSingle = !wifeFirst && !wifeLast;

      let rowStatus: 'valid' | 'warning' | 'error' = 'valid';
      let validationMessage = 'Ready for import';

      if (!husbandFirst && !wifeFirst) {
        rowStatus = 'error';
        validationMessage = 'Missing First Name for primary member or couple.';
      } else if (!husbandLast && !wifeLast) {
        rowStatus = 'error';
        validationMessage = 'Missing Last Name.';
      } else if (!isSingle && !wifeFirst) {
        rowStatus = 'warning';
        validationMessage = 'Wife details incomplete (only husband first name provided).';
      } else if (!husbandContact && !wifeContact && !husbandEmail) {
        rowStatus = 'warning';
        validationMessage = 'No contact phone or email provided.';
      }

      // Match household group ID if group name supplied
      let householdGroupId = '';
      if (householdGroupName) {
        const matchedGroup = householdGroups.find(
          (g) => g.name.toLowerCase().trim() === householdGroupName.toLowerCase().trim()
        );
        if (matchedGroup) {
          householdGroupId = matchedGroup.id;
        }
      }

      const coupleObj: Partial<DirectoryCouple> = {
        husbandFirstName: husbandFirst || (isSingle ? wifeFirst : ''),
        husbandLastName: husbandLast || (isSingle ? wifeLast : ''),
        husbandNickname: husbandNick,
        husbandContact: husbandContact,
        husbandEmail: husbandEmail,
        husbandBirthday: husbandBday,
        husbandOccupation: husbandJob,
        wifeFirstName: wifeFirst,
        wifeLastName: wifeLast || husbandLast,
        wifeNickname: wifeNick,
        wifeContact: wifeContact,
        wifeEmail: wifeEmail,
        wifeBirthday: wifeBday,
        wifeOccupation: wifeJob,
        weddingAnniversary: weddingAnniv,
        ministry,
        barangay,
        address: address || `Brgy. ${barangay}, Tuy, Batangas`,
        householdGroupId,
        householdGroupName,
        status,
        notes,
        coordinates: [120.7289, 14.0228],
      };

      parsedResults.push({
        index: idx,
        couple: coupleObj,
        rowStatus,
        validationMessage,
        isSingleMember: isSingle,
      });

      if (rowStatus !== 'error') {
        validIndices.add(idx);
      }
    });

    if (parsedResults.length === 0) {
      setErrorMsg('No valid data rows found in the CSV.');
      return;
    }

    setParsedRows(parsedResults);
    setSelectedIndices(validIndices);
    setStep('preview');
  };

  // ---------------------------------------------------------------------------
  // File Change Handler
  // ---------------------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSVData(text);
    };
    reader.readAsText(file);
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSVData(text);
    };
    reader.readAsText(file);
  };

  // Handle Raw Text Paste submit
  const handlePasteSubmit = () => {
    if (!csvText.trim()) {
      setErrorMsg('Please paste your CSV or tabular text into the text area.');
      return;
    }
    setFileName('Pasted Data');
    parseCSVData(csvText);
  };

  // Toggles row selection
  const toggleRowSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Select all / Deselect all
  const toggleSelectAll = () => {
    const eligibleIndices = parsedRows.filter((r) => r.rowStatus !== 'error').map((r) => r.index);
    if (selectedIndices.size === eligibleIndices.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(eligibleIndices));
    }
  };

  // ---------------------------------------------------------------------------
  // Execute Bulk Import
  // ---------------------------------------------------------------------------
  const handleExecuteImport = async () => {
    const rowsToImport = parsedRows.filter(
      (r) => selectedIndices.has(r.index) && r.rowStatus !== 'error'
    );

    if (rowsToImport.length === 0) {
      alert('Please select at least one valid row to import.');
      return;
    }

    try {
      setIsProcessing(true);

      const couplesPayload: Partial<DirectoryCouple>[] = rowsToImport.map((r) => r.couple);

      // Save Directory Couples in Bulk
      const couplesResult = await saveDirectoryCouplesBulk(couplesPayload);

      let createdUsersCount = 0;

      // Create User Accounts if enabled
      if (createAccounts) {
        const usersToCreate: Array<Partial<UserProfile> & { password?: string }> = [];

        couplesResult.couples.forEach((c) => {
          // Husband / Primary profile
          if (c.husbandEmail) {
            usersToCreate.push({
              fullName: `Bro. ${c.husbandFirstName} ${c.husbandLastName}`,
              spouseName: c.wifeFirstName ? `Sis. ${c.wifeFirstName} ${c.wifeLastName}` : '',
              email: c.husbandEmail,
              phoneNumber: c.husbandContact,
              barangay: c.barangay,
              ministry: c.ministry,
              role: 'member',
              password: 'password123',
            });
          }
          // Wife profile if distinct email provided
          if (c.wifeEmail && c.wifeEmail.toLowerCase() !== c.husbandEmail?.toLowerCase()) {
            usersToCreate.push({
              fullName: `Sis. ${c.wifeFirstName} ${c.wifeLastName}`,
              spouseName: `Bro. ${c.husbandFirstName} ${c.husbandLastName}`,
              email: c.wifeEmail,
              phoneNumber: c.wifeContact,
              barangay: c.barangay,
              ministry: c.ministry,
              role: 'member',
              password: 'password123',
            });
          }
        });

        if (usersToCreate.length > 0) {
          const savedUsers = await saveUsersBulk(usersToCreate);
          createdUsersCount = savedUsers.length;
        }
      }

      setImportStats({
        total: rowsToImport.length,
        couples: couplesResult.savedCount,
        users: createdUsersCount,
      });

      setStep('success');
      onImportSuccess(couplesResult.couples, createdUsersCount);
    } catch (err) {
      console.error('Bulk upload failed:', err);
      alert('An error occurred during bulk import. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset modal state
  const handleReset = () => {
    setStep('input');
    setCsvText('');
    setFileName(null);
    setErrorMsg(null);
    setParsedRows([]);
    setSelectedIndices(new Set());
    setFilterStatus('all');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* =================================================================== */}
        {/* MODAL HEADER                                                        */}
        {/* =================================================================== */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-0.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Bulk Data Import</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Bulk Upload Members &amp; Couples
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================== */}
        {/* MODAL BODY (STEPS)                                                   */}
        {/* =================================================================== */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: UPLOAD / PASTE INPUT */}
          {step === 'input' && (
            <div className="space-y-6">
              {/* Header Info Banner & Sample Download Button */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
                    <p className="font-bold">
                      Upload a CSV file containing Couples for Christ members, nicknames, family details, and barangays.
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Supports full couples (Husband &amp; Wife) as well as single ministry members (SFC, YFC, KFC, HOLD, SOLD).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
                >
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {/* Input Tabs: File Upload vs Raw Paste */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    activeTab === 'upload'
                      ? 'bg-[#243c81] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload CSV File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    activeTab === 'paste'
                      ? 'bg-[#243c81] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Paste Text / Excel Data</span>
                </button>
              </div>

              {/* Tab 1: File Dropzone */}
              {activeTab === 'upload' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .tsv, .txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xs">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {fileName ? fileName : 'Click or Drag & Drop CSV file here'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Supports standard CSV files (.csv), TSV (.tsv), or comma-delimited text documents (.txt)
                  </p>
                </div>
              )}

              {/* Tab 2: Raw Text Area */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Paste CSV rows here. Example:&#10;Husband First Name, Husband Last Name, Wife First Name, Ministry, Barangay&#10;Juan, Dela Cruz, Maria, CFC, Rizal (Pob.)"
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handlePasteSubmit}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Parse Pasted Data</span>
                  </button>
                </div>
              )}

              {/* Error Alert if any */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Column Mapping Reference */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Supported CSV Header Columns
                </h4>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    'Husband First Name',
                    'Husband Last Name',
                    'Husband Nickname',
                    'Husband Contact',
                    'Husband Email',
                    'Husband Birthday',
                    'Husband Occupation',
                    'Wife First Name',
                    'Wife Last Name',
                    'Wife Nickname',
                    'Wife Contact',
                    'Wife Email',
                    'Wife Birthday',
                    'Wife Occupation',
                    'Wedding Anniversary',
                    'Ministry',
                    'Barangay',
                    'Address',
                    'Household Group',
                    'Status',
                    'Notes',
                  ].map((col) => (
                    <span
                      key={col}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION GRID */}
          {step === 'preview' && (
            <div className="space-y-5">
              {/* Stat Pills & Filter Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      filterStatus === 'all'
                        ? 'bg-[#243c81] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All Rows ({counts.total})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus('valid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      filterStatus === 'valid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Ready ({counts.valid})</span>
                  </button>

                  {counts.warning > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus('warning')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        filterStatus === 'warning'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Warnings ({counts.warning})</span>
                    </button>
                  )}

                  {counts.error > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus('error')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                        filterStatus === 'error'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Errors ({counts.error})</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload New File</span>
                  </button>
                </div>
              </div>

              {/* Options Box: User Profile Generation Toggle */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    id="createAccountsToggle"
                    type="checkbox"
                    checked={createAccounts}
                    onChange={(e) => setCreateAccounts(e.target.checked)}
                    className="w-4 h-4 rounded-md text-amber-600 accent-amber-500 cursor-pointer"
                  />
                  <label htmlFor="createAccountsToggle" className="text-xs font-bold text-slate-900 dark:text-slate-100 cursor-pointer">
                    Automatically create user login accounts for members with valid email addresses
                  </label>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {selectedIndices.size} of {parsedRows.length} rows selected for import
                </div>
              </div>

              {/* Interactive Data Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-[360px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              selectedIndices.size > 0 &&
                              selectedIndices.size ===
                                parsedRows.filter((r) => r.rowStatus !== 'error').length
                            }
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded-md accent-emerald-600 cursor-pointer"
                          />
                        </th>
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Husband / Member Name</th>
                        <th className="p-3">Wife Name</th>
                        <th className="p-3">Ministry</th>
                        <th className="p-3">Barangay</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Household Group</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {displayedRows.map((row) => {
                        const isSelected = selectedIndices.has(row.index);
                        const c = row.couple;

                        return (
                          <tr
                            key={row.index}
                            className={`transition-colors ${
                              row.rowStatus === 'error'
                                ? 'bg-rose-50/50 dark:bg-rose-950/20 opacity-70'
                                : isSelected
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                disabled={row.rowStatus === 'error'}
                                checked={isSelected}
                                onChange={() => toggleRowSelection(row.index)}
                                className="w-4 h-4 rounded-md accent-emerald-600 cursor-pointer disabled:opacity-30"
                              />
                            </td>
                            <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                              {row.index + 1}
                            </td>
                            <td className="p-3">
                              {row.rowStatus === 'valid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Ready
                                </span>
                              )}
                              {row.rowStatus === 'warning' && (
                                <span
                                  title={row.validationMessage}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold"
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Warning
                                </span>
                              )}
                              {row.rowStatus === 'error' && (
                                <span
                                  title={row.validationMessage}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold"
                                >
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  Error
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {c.husbandFirstName} {c.husbandLastName}
                              {c.husbandNickname && (
                                <span className="text-[11px] text-slate-400 font-normal ml-1">
                                  ({c.husbandNickname})
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                              {c.wifeFirstName ? (
                                <>
                                  {c.wifeFirstName} {c.wifeLastName}
                                  {c.wifeNickname && (
                                    <span className="text-[11px] text-slate-400 font-normal ml-1">
                                      ({c.wifeNickname})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Single / N/A</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-[#243c81] dark:text-blue-300 text-[10px] font-black">
                                {c.ministry || 'CFC'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                              {c.barangay}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                              {c.husbandContact || c.wifeContact || c.husbandEmail || '—'}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">
                              {c.householdGroupName || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS SUMMARY */}
          {step === 'success' && importStats && (
            <div className="py-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/30 shadow-lg animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Bulk Import Successful!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Successfully imported member records into the CFC Tuy Directory.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Processed</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{importStats.total}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Couples / Members Added</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{importStats.couples}</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">User Accounts Created</p>
                  <p className="text-2xl font-black text-[#243c81] dark:text-blue-300 mt-1">{importStats.users}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* MODAL FOOTER ACTION BAR                                             */}
        {/* =================================================================== */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
          >
            {step === 'success' ? 'Close' : 'Cancel'}
          </button>

          {step === 'preview' && (
            <button
              type="button"
              disabled={selectedIndices.size === 0 || isProcessing}
              onClick={handleExecuteImport}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs transition-all shadow-md flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing Members...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Import {selectedIndices.size} Selected Member(s)</span>
                </>
              )}
            </button>
          )}

          {step === 'success' && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
