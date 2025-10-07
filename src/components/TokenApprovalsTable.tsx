"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { Approval } from "@/lib/types";

interface TokenApprovalsTableProps {
  approvals: Approval[];
  selectedApprovals: string[];
  onSelectApproval: (approvalId: string, selected: boolean) => void;
  onSelectAll: () => void;
  onSelectPage: () => void;
  currentApprovals: Approval[];
  onRevoke: (approval: Approval) => void;
  isRevoking: boolean;
  onEditAllowance: (approval: Approval) => void;
  editingApprovalId: string | null;
  editValue: string;
  onEditValueChange: (value: string, decimals: number) => void;
  onSaveEdit: (approval: Approval) => void;
  onCancelEdit: () => void;
  inputError: string;
  formatBalance: (approval: Approval) => string | null;
  formatAllowance: (approval: Approval) => string;
  formatDecimalExample: (decimals: number) => string;
  copyToClipboard: (text: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function TokenApprovalsTable({
  approvals,
  selectedApprovals,
  onSelectApproval,
  onSelectAll,
  onSelectPage,
  currentApprovals,
  onRevoke,
  isRevoking,
  onEditAllowance,
  editingApprovalId,
  editValue,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  inputError,
  formatBalance,
  formatAllowance,
  formatDecimalExample,
  copyToClipboard,
  searchTerm,
  onSearchChange,
}: TokenApprovalsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpanded = (approvalId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(approvalId)) {
        newSet.delete(approvalId);
      } else {
        newSet.add(approvalId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-transparent backdrop-blur-md rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      {/* Modern Table Header with Search */}
      <div className="p-2 bg-transparent border-b border-gray-200 dark:border-gray-600">
        <div className="flex flex-col gap-3">
          {/* Top Row - Title and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Token Approvals
                </h2>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-600/60 px-2 py-1 rounded-full">
                {approvals.length} found
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-transparent rounded-lg p-1">
                <button
                  onClick={onSelectAll}
                  className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-all duration-200"
                >
                  {(selectedApprovals?.length || 0) === (approvals?.length || 0)
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                <button
                  onClick={onSelectPage}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/50 rounded-md transition-all duration-200"
                >
                  {currentApprovals.every((approval) =>
                    (selectedApprovals || []).includes(approval.id)
                  )
                    ? "Deselect Page"
                    : "Select Page"}
                </button>
              </div>
            </div>
          </div>

          {/* Search Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens, addresses..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-xs border border-gray-300 dark:border-gray-800 rounded-lg bg-transparent text-gray-900 dark:text-gray-100 outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <XMarkIcon className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block sm:hidden">
        {currentApprovals.map((approval) => {
          const isExpanded = expandedRows.has(approval.id);
          return (
            <div
              key={approval.id}
              className="border-b border-gray-200 dark:border-gray-800 last:border-b-0"
            >
              {/* Compact Row */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleExpanded(approval.id)}
              >
                <div className="flex items-center justify-between">
                  {/* Left Side - Token Info with Checkbox */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={(selectedApprovals || []).includes(approval.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectApproval(approval.id, e.target.checked);
                      }}
                      className="w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-800 dark:border-gray-600 checked:bg-indigo-600 checked:border-indigo-600 flex-shrink-0"
                    />

                    {/* Token Logo */}
                    <div className="flex-shrink-0">
                      {approval.tokenLogo ? (
                        <Image
                          src={approval.tokenLogo}
                          width={24}
                          height={24}
                          alt={approval.tokenSymbol || "Token"}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {approval.tokenSymbol?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {(() => {
                          const tokenName =
                            approval.tokenName || "Unknown Token";
                          return tokenName.length > 15
                            ? tokenName.slice(0, 15) + "..."
                            : tokenName;
                        })()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {(() => {
                          const tokenSymbol = approval.tokenSymbol || "";
                          return tokenSymbol.length > 15
                            ? tokenSymbol.slice(0, 15) + "..."
                            : tokenSymbol;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevoke(approval);
                      }}
                      disabled={isRevoking}
                      className="px-3 py-1.5 text-xs rounded-md font-medium transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRevoking ? "Revoking..." : "Revoke"}
                    </button>

                    {/* Expand Arrow */}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-3 pb-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-2">
                    {/* Compact Grid Layout */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Token Address */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                            Token Address
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-600">
                          <span className="flex-1">
                            {approval.tokenAddress.slice(0, 6)}...
                            {approval.tokenAddress.slice(-4)}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(approval.tokenAddress)
                            }
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                          >
                            <ClipboardDocumentIcon className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      {/* Spender Address */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                            Spender Address
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-600">
                          <span className="flex-1">
                            {approval.spender.slice(0, 6)}...
                            {approval.spender.slice(-4)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(approval.spender)}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                          >
                            <ClipboardDocumentIcon className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="space-y-1">
                        <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                          Your Balance
                        </span>
                        <div className="text-[10px] font-medium text-gray-900 dark:text-gray-100">
                          {formatBalance(approval) || "0"}{" "}
                          {approval.tokenSymbol}
                        </div>
                      </div>

                      {/* Approved Amount with Unlimited Check */}
                      <div className="space-y-1">
                        <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                          Approved Amount
                        </span>
                        <div className="text-[10px] font-medium text-gray-900 dark:text-gray-100 break-all">
                          {formatAllowance(approval)}
                        </div>
                      </div>

                      {/* Token Price */}
                      {approval.tokenUsdPrice && (
                        <div className="space-y-1">
                          <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                            Token Price
                          </span>
                          <div className="text-[10px] font-medium text-gray-900 dark:text-gray-100">
                            ${Number(approval.tokenUsdPrice).toFixed(4)}
                          </div>
                        </div>
                      )}

                      {/* USD at Risk */}
                      {approval.tokenUsdAtRisk && (
                        <div className="space-y-1">
                          <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                            USD at Risk
                          </span>
                          <div className="text-[10px] font-medium text-red-600 dark:text-red-400">
                            $
                            {(() => {
                              try {
                                return Number(
                                  approval.tokenUsdAtRisk
                                ).toLocaleString();
                              } catch {
                                return approval.tokenUsdAtRisk;
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                      {editingApprovalId === approval.id ? (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) =>
                                  onEditValueChange(
                                    e.target.value,
                                    approval.tokenDecimals
                                  )
                                }
                                placeholder={`Enter amount (e.g., 100, 0.5, unlimited)`}
                                className={`flex-1 px-2 py-1 text-[10px] border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                                  inputError
                                    ? "border-red-300 dark:border-red-600"
                                    : "border-gray-300 dark:border-gray-600"
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="text-[9px] text-gray-500 dark:text-gray-400">
                              Decimals: {approval.tokenDecimals} • Example:{" "}
                              {formatDecimalExample(approval.tokenDecimals)}
                            </div>
                            {inputError && (
                              <div className="text-[9px] text-red-500 dark:text-red-400">
                                {inputError}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (editValue.trim() && !inputError) {
                                  onSaveEdit(approval);
                                }
                              }}
                              disabled={
                                isRevoking || !editValue.trim() || !!inputError
                              }
                              className="flex-1 px-2 py-1 text-[10px] rounded font-medium transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelEdit();
                              }}
                              disabled={isRevoking}
                              className="flex-1 px-2 py-1 text-[10px] rounded font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditAllowance(approval);
                          }}
                          disabled={isRevoking}
                          className="w-full px-3 py-1.5 text-[10px] rounded font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Edit Allowance
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
