import React, { useState, useMemo } from 'react';
import { Upload, FileWarning, CheckCircle, Search, X, Clipboard, Download, ArrowRight, Settings, Database, Layout, Component as Components, Workflow, Code } from 'lucide-react';
import { JSONTree } from 'react-json-tree';

interface Toast {
  id: number;
  message: string;
}

function App() {
  const [optionSets, setOptionSets] = useState<string[]>([]);
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [reusableElements, setReusableElements] = useState<string[]>([]);
  const [workflows, setWorkflows] = useState<string[]>([]);
  const [apiNames, setApiNames] = useState<string[]>([]);
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchedPaths, setMatchedPaths] = useState<string[][]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const theme = {
    scheme: 'tomorrow',
    base00: '#ffffff',
    base01: '#e0e0e0',
    base02: '#d6d6d6',
    base03: '#8e908c',
    base04: '#969896',
    base05: '#4d4d4c',
    base06: '#282a2e',
    base07: '#1d1f21',
    base08: '#c82829',
    base09: '#f5871f',
    base0A: '#eab700',
    base0B: '#718c00',
    base0C: '#3e999f',
    base0D: '#4271ae',
    base0E: '#8959a8',
    base0F: '#a3685a',
  };

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 2000);
  };

  const copyNamesToClipboard = async (names: string[]) => {
    try {
      await navigator.clipboard.writeText(names.join('\n'));
      showToast('Copied!');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy');
    }
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded!');
  };

  function filterTree(obj: any, term: string, path: string[] = [], matches: string[][] = []): any {
    if (typeof obj === 'string') {
      if (obj.toLowerCase().includes(term)) {
        matches.push([...path]);
        return obj;
      }
      return null;
    }
    if (typeof obj !== 'object' || obj === null) {
      return null;
    }
    const isArray = Array.isArray(obj);
    const result = isArray ? [] : {};
    let hasMatchHere = false;

    for (const key in obj) {
      const val = obj[key];
      const newPath = [...path, key];
      const keyMatches = key.toLowerCase().includes(term);
      const filtered = filterTree(val, term, newPath, matches);

      if (keyMatches || filtered != null) {
        result[key] = keyMatches ? val : filtered;
        hasMatchHere = true;
        if (keyMatches) matches.push(newPath);
      }
    }
    return hasMatchHere ? result : null;
  }

  const { filteredJson, matched } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || !jsonData) return { filteredJson: jsonData, matched: [] };

    const matches: string[][] = [];
    const filtered = filterTree(jsonData, term, [], matches) || {};
    return { filteredJson: filtered, matched: matches };
  }, [jsonData, searchTerm]);

  React.useEffect(() => {
    setMatchedPaths(matched);
  }, [matched]);

  const handleItemClick = (term: string) => {
    setSearchTerm(term);
    const jsonSection = document.querySelector('.json-section');
    if (jsonSection) {
      jsonSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getSectionIcon = (title: string) => {
    switch (title) {
      case 'Option Sets':
        return <Settings className="w-4 h-4 text-gray-500" />;
      case 'Data Types':
        return <Database className="w-4 h-4 text-gray-500" />;
      case 'Pages':
        return <Layout className="w-4 h-4 text-gray-500" />;
      case 'Reusable Elements':
        return <Components className="w-4 h-4 text-gray-500" />;
      case 'Workflows':
        return <Workflow className="w-4 h-4 text-gray-500" />;
      case 'API Names':
        return <Code className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const renderItems = (items: string[], title: string) => (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div
          key={index}
          className="group/item"
        >
          <button
            onClick={() => handleItemClick(item)}
            className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 flex items-center justify-between transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              {getSectionIcon(title)}
              <span className="text-sm text-gray-600 group-hover/item:text-blue-600 transition-colors duration-200">
                {item}
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400 opacity-0 group-hover/item:opacity-100 group-hover/item:text-blue-500 transition-all duration-200" />
          </button>
        </div>
      ))}
    </div>
  );

  const renderSection = (title: string, items: string[], count: number, rawData?: any) => (
    <details className="group mb-4">
      <summary className="cursor-pointer bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getSectionIcon(title)}
          <span className="font-medium">{title}</span>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              copyNamesToClipboard(items);
            }}
            title="Copy names"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Clipboard className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              downloadJSON(rawData || items, title.toLowerCase().replace(/\s+/g, '_'));
            }}
            title="Download JSON"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Download className="w-4 h-4 text-gray-600" />
          </button>
          <div className="transition-transform group-open:rotate-180 ml-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </summary>
      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
        {renderItems(items, title)}
      </div>
    </details>
  );

  const handleFile = (file: File | null) => {
    setError(null);
    setJsonData(null);
    setSearchTerm('');
    setMatchedPaths([]);
    
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large! Maximum size is 50 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const json = JSON.parse(content);
        setJsonData(json);
        
        const extractedOptionSets = extractSection(json, 'option_sets', 'display');
        setOptionSets(extractedOptionSets);

        const extractedDataTypes = Object.values(json.user_types || {})
          .map((d: any) => d.name || d.display)
          .filter(Boolean);
        setDataTypes(extractedDataTypes);

        const extractedPages = extractSection(json, 'pages', 'name');
        setPages(extractedPages);

        const extractedElements = extractSection(json, 'element_definitions', 'name');
        setReusableElements(extractedElements);

        const extractedWorkflows = Object.values(json.api || {})
          .map((w: any) => w.properties?.wf_name)
          .filter(Boolean);
        setWorkflows(extractedWorkflows);

        const extractedApiNames = Object.values(json.api || {})
          .map((w: any) => w.properties?.wf_name)
          .filter(Boolean);
        setApiNames(extractedApiNames);

      } catch (err) {
        console.error('Parse error:', err);
        setError(`Error parsing file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      setError('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  function extractSection(json: any, key: string, field: string): string[] {
    try {
      if (!json[key]) return [];
      const values = Object.values(json[key]);
      if (!Array.isArray(values)) return [];
      return values
        .map((item: any) => item?.[field])
        .filter(Boolean);
    } catch (err) {
      console.warn(`Error extracting ${key}.${field}:`, err);
      return [];
    }
  }

  const hasData = pages.length > 0 || jsonData !== null;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Toast Container */}
        <div className="fixed bottom-4 right-4 z-50">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="mb-2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-fade-in"
            >
              {toast.message}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bubble App JSON Explorer
          </h1>
          <p className="text-gray-600">
            Upload your Bubble.io export file to analyze its contents
          </p>
        </div>

        <div
          className={`mb-8 border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <label className="cursor-pointer">
              <span className="mt-2 text-base leading-normal">
                Drop your file here, or{' '}
                <span className="text-blue-600 hover:text-blue-700">browse</span>
              </span>
              <input
                type="file"
                className="hidden"
                accept=".bubble,.json"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </label>
            <div className="space-y-1 mt-1">
              <p className="text-xs text-gray-500">
                Accepts .bubble or .json files • Maximum size: 50 MB
              </p>
              <p className="text-xs text-emerald-600 font-medium">
                Everything happens client-side in your browser. Your data and API keys are safe.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <FileWarning className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Parse Results
                </h2>
              </div>

              {renderSection('Option Sets', optionSets, optionSets.length, jsonData?.option_sets)}
              {renderSection('Data Types', dataTypes, dataTypes.length, jsonData?.user_types)}
              {renderSection('Pages', pages, pages.length, jsonData?.pages)}
              {renderSection('Reusable Elements', reusableElements, reusableElements.length, jsonData?.element_definitions)}
              {renderSection('Workflows', workflows, workflows.length, jsonData?.workflows)}
              {renderSection('API Names', apiNames, apiNames.length, jsonData?.api)}
            </div>

            {jsonData && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8 json-section">
                <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Full JSON Structure
                </h2>
              </div>
                
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search JSON..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="max-h-[80vh] overflow-auto border border-gray-200 rounded-lg p-4">
                  <JSONTree
                    data={filteredJson}
                    theme={theme}
                    shouldExpandNodeInitially={(keyPath) => {
                      if (searchTerm) {
                        return matchedPaths.some(mp => {
                          const pathStr = mp.join('.');
                          const keyPathStr = keyPath.join('.');
                          return pathStr.startsWith(keyPathStr);
                        });
                      }
                      return keyPath.length === 1;
                    }}
                    hideRoot={false}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;