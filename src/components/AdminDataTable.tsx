import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ColumnDef<T> {
  id: string;
  header: React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (item: T) => any;
  cell?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  width?: string;
  hideOnMobile?: boolean;
}

export interface AdminDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T, index: number) => string;
  
  // Title & Header info
  title?: string;
  subtitle?: string;
  totalCountLabel?: string;
  
  // Loading, Error, Empty states
  isLoading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: keyof typeof Icons | React.ComponentType<{ className?: string }>;
  emptyAction?: React.ReactNode;
  
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchFields?: (keyof T | ((item: T) => string | number | null | undefined))[];
  
  // Custom Filters & Actions
  filtersSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  
  // Sorting
  initialSortKey?: string;
  initialSortDirection?: 'asc' | 'desc';
  onSortChange?: (sortKey: string | null, direction: 'asc' | 'desc') => void;
  
  // Pagination
  pagination?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  
  // Selection & Bulk Actions
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
  
  // Row Interaction
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  
  // Mobile / Responsive Layout
  renderCard?: (item: T, index: number) => React.ReactNode;
  defaultViewMode?: 'table' | 'cards';
  allowViewToggle?: boolean;
  
  // Styling
  theme?: 'dark' | 'light' | 'adaptive';
  tableMinWidth?: string;
  compact?: boolean;
}

export function AdminDataTable<T>({
  data = [],
  columns,
  keyExtractor,
  title,
  subtitle,
  totalCountLabel = 'items',
  isLoading = false,
  loadingMessage = 'Loading data...',
  error = null,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  emptyIcon: EmptyIconComp = Icons.FolderX,
  emptyAction,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchValue: controlledSearch,
  onSearchChange,
  searchFields,
  filtersSlot,
  actionsSlot,
  initialSortKey,
  initialSortDirection = 'asc',
  onSortChange,
  pagination = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  selectable = false,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  bulkActions,
  onRowClick,
  rowClassName,
  renderCard,
  defaultViewMode = 'table',
  allowViewToggle = true,
  tableMinWidth = 'min-w-[800px]',
  compact = false,
}: AdminDataTableProps<T>) {
  // Local Search state if uncontrolled
  const [internalSearch, setInternalSearch] = useState('');
  const searchTerm = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const handleSearch = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  // View Mode state (Table vs Cards)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(defaultViewMode);

  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Selection state
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = controlledSelectedIds !== undefined ? controlledSelectedIds : internalSelectedIds;

  const handleSelectToggle = (id: string) => {
    let next: string[];
    if (selectedIds.includes(id)) {
      next = selectedIds.filter((item) => item !== id);
    } else {
      next = [...selectedIds, id];
    }
    if (onSelectionChange) {
      onSelectionChange(next);
    } else {
      setInternalSelectedIds(next);
    }
  };

  const handleSelectAll = (allIdsOnPage: string[]) => {
    const allSelected = allIdsOnPage.every((id) => selectedIds.includes(id));
    let next: string[];
    if (allSelected) {
      next = selectedIds.filter((id) => !allIdsOnPage.includes(id));
    } else {
      next = Array.from(new Set([...selectedIds, ...allIdsOnPage]));
    }
    if (onSelectionChange) {
      onSelectionChange(next);
    } else {
      setInternalSelectedIds(next);
    }
  };

  const clearSelection = () => {
    if (onSelectionChange) {
      onSelectionChange([]);
    } else {
      setInternalSelectedIds([]);
    }
  };

  // Filtering by Search Query
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const query = searchTerm.toLowerCase().trim();

    return data.filter((item) => {
      if (searchFields && searchFields.length > 0) {
        return searchFields.some((field) => {
          let val: any;
          if (typeof field === 'function') {
            val = field(item);
          } else {
            val = item[field];
          }
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      }

      // Default: Search across all column accessors
      return columns.some((col) => {
        let val: any;
        if (col.accessorFn) {
          val = col.accessorFn(item);
        } else if (col.accessorKey) {
          val = item[col.accessorKey];
        }
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchTerm, searchFields, columns]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.id === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      if (col.sortFn) {
        const res = col.sortFn(a, b);
        return sortDirection === 'asc' ? res : -res;
      }

      let valA: any;
      let valB: any;

      if (col.accessorFn) {
        valA = col.accessorFn(a);
        valB = col.accessorFn(b);
      } else if (col.accessorKey) {
        valA = a[col.accessorKey];
        valB = b[col.accessorKey];
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      const comp = strA.localeCompare(strB);
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Pagination Math
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, safeCurrentPage, pageSize]);

  const currentPageIds = useMemo(() => {
    return paginatedData.map((item, idx) => keyExtractor(item, idx));
  }, [paginatedData, keyExtractor]);

  const isAllPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
  const isSomePageSelected =
    currentPageIds.some((id) => selectedIds.includes(id)) && !isAllPageSelected;

  // Sorting click handler
  const handleHeaderSortClick = (col: ColumnDef<T>) => {
    if (!col.sortable) return;
    let nextDir: 'asc' | 'desc' = 'asc';
    let nextKey: string | null = col.id;

    if (sortKey === col.id) {
      if (sortDirection === 'asc') {
        nextDir = 'desc';
      } else {
        nextKey = null; // Reset sort
      }
    }

    setSortKey(nextKey);
    setSortDirection(nextDir);
    if (onSortChange) {
      onSortChange(nextKey, nextDir);
    }
  };

  // Page Numbers Generator
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const startRecord = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <div className="w-full space-y-4 font-sans max-w-full overflow-hidden">
      {/* Top Header & Controls Toolbar */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Title and Top Row */}
        {(title || actionsSlot || (renderCard && allowViewToggle)) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            {title && (
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">{title}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-950/80 text-indigo-400 border border-indigo-900/60">
                    {totalItems} {totalCountLabel}
                  </span>
                </div>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {renderCard && allowViewToggle && (
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'table'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Table View"
                  >
                    <Icons.Table className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'cards'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Cards View"
                  >
                    <Icons.LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                </div>
              )}

              {actionsSlot}
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {searchable && (
            <div className="relative flex-1 min-w-[240px]">
              <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  handleSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    handleSearch('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Additional Custom Filter Slots */}
          {filtersSlot && (
            <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1 max-w-full">
              {filtersSlot}
            </div>
          )}
        </div>

        {/* Bulk Action Bar (when items are selected) */}
        {selectable && selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-indigo-950/70 border border-indigo-800/80 rounded-xl px-3.5 py-2 text-xs text-indigo-200"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-indigo-300">
                {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer ml-2"
              >
                Clear
              </button>
            </div>

            {bulkActions && (
              <div className="flex items-center gap-2">
                {bulkActions(selectedIds, clearSelection)}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Main Table / Cards / States Container */}
      <div className="relative rounded-2xl border border-slate-800/90 bg-slate-900/90 shadow-md overflow-hidden">
        {/* Error State */}
        {error ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <Icons.AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Error Loading Records</h3>
            <p className="text-xs text-rose-400 max-w-md mx-auto">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer mt-2"
              >
                Retry
              </button>
            )}
          </div>
        ) : isLoading ? (
          /* Loading State */
          <div className="py-20 px-6 text-center space-y-3">
            <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-400">{loadingMessage}</p>
          </div>
        ) : totalItems === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 border border-slate-700/60 flex items-center justify-center mx-auto mb-2">
              {typeof EmptyIconComp === 'function' ? (
                <EmptyIconComp className="w-6 h-6" />
              ) : (
                <Icons.FolderX className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-200">{emptyTitle}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{emptyDescription}</p>
            {emptyAction && <div className="pt-2">{emptyAction}</div>}
          </div>
        ) : viewMode === 'cards' && renderCard ? (
          /* Cards View Mode */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map((item, index) => renderCard(item, (safeCurrentPage - 1) * pageSize + index))}
          </div>
        ) : (
          /* Table View Mode with contained scrolling */
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            <table className={`w-full text-left text-xs border-collapse ${tableMinWidth}`}>
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                  {selectable && (
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomePageSelected;
                        }}
                        onChange={() => handleSelectAll(currentPageIds)}
                        className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                  )}

                  {columns.map((col) => {
                    const isSorted = sortKey === col.id;
                    return (
                      <th
                        key={col.id}
                        onClick={() => handleHeaderSortClick(col)}
                        style={{ width: col.width }}
                        className={`py-3.5 px-4 whitespace-nowrap select-none ${
                          col.sortable ? 'cursor-pointer hover:text-white hover:bg-slate-900 transition-colors' : ''
                        } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${
                          col.headerClassName || ''
                        } ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                      >
                        <div
                          className={`inline-flex items-center gap-1.5 ${
                            col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : ''
                          }`}
                        >
                          <span>{col.header}</span>
                          {col.sortable && (
                            <span className="text-slate-500">
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <Icons.ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                                ) : (
                                  <Icons.ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                                )
                              ) : (
                                <Icons.ChevronsUpDown className="w-3 h-3 text-slate-600 opacity-60 hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {paginatedData.map((item, index) => {
                  const id = keyExtractor(item, index);
                  const isSelected = selectable && selectedIds.includes(id);
                  const customRowClass = rowClassName ? rowClassName(item, index) : '';

                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick && onRowClick(item, index)}
                      className={`group transition-all ${
                        onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : 'hover:bg-slate-800/30'
                      } ${isSelected ? 'bg-indigo-950/40' : ''} ${customRowClass}`}
                    >
                      {selectable && (
                        <td
                          className="py-3 px-4 text-center w-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectToggle(id)}
                            className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}

                      {columns.map((col) => {
                        let content: React.ReactNode;
                        if (col.cell) {
                          content = col.cell(item, (safeCurrentPage - 1) * pageSize + index);
                        } else if (col.accessorFn) {
                          content = col.accessorFn(item);
                        } else if (col.accessorKey) {
                          content = item[col.accessorKey] as any;
                        } else {
                          content = null;
                        }

                        return (
                          <td
                            key={col.id}
                            className={`py-3.5 px-4 text-slate-300 ${
                              col.align === 'right'
                                ? 'text-right'
                                : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                            } ${col.className || ''} ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Footer Controls */}
        {pagination && totalItems > 0 && (
          <div className="bg-slate-950/80 border-t border-slate-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            {/* Page Count & Size Selector */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span>entries</span>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Showing <strong className="text-slate-300 font-mono">{startRecord}</strong> to{' '}
                <strong className="text-slate-300 font-mono">{endRecord}</strong> of{' '}
                <strong className="text-slate-300 font-mono">{totalItems}</strong> entries
              </span>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="First Page"
              >
                <Icons.ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Page"
              >
                <Icons.ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {getPageNumbers().map((p, pIdx) => {
                  if (typeof p === 'string') {
                    return (
                      <span key={`ellipsis-${pIdx}`} className="px-1.5 text-slate-600 font-mono">
                        {p}
                      </span>
                    );
                  }
                  const isCurrent = p === safeCurrentPage;
                  return (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[28px] h-7 px-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Page"
              >
                <Icons.ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Last Page"
              >
                <Icons.ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
