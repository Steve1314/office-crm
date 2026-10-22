import React from 'react';

/**
 * Universal Base Skeleton element with shimmer wave animation
 */
export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '8px',
  circle = false,
  className = '',
  style = {}
}) {
  return (
    <div
      className={`skeleton-base ${circle ? 'skeleton-circle' : ''} ${className}`}
      style={{
        width: circle ? height : width,
        height,
        borderRadius: circle ? '50%' : borderRadius,
        ...style
      }}
    />
  );
}

/**
 * Skeleton Loader for Dashboard Metric Cards
 */
export function MetricCardsSkeleton() {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3">
      <div className="flex min-h-28 w-full flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:min-h-32 sm:p-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width="34px" height="34px" borderRadius="10px" />
          <Skeleton width="65px" height="12px" />
          <Skeleton width="45px" height="24px" borderRadius="6px" />
        </div>
        <div style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
          <Skeleton width="42px" height="12px" />
        </div>
      </div>

      <div className="flex min-h-28 w-full flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:min-h-32 sm:p-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width="34px" height="34px" borderRadius="10px" />
          <Skeleton width="75px" height="12px" />
          <Skeleton width="80px" height="24px" borderRadius="6px" />
        </div>
        <div style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
          <Skeleton width="42px" height="12px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Loader for 3 Top KPI Cards (Issued, Spent, Remaining) in Expenses
 */
export function ExpensesKpiSkeleton() {
  return (
    <div className="mb-5 grid w-full grid-cols-3 gap-2 sm:gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex min-h-16 w-full flex-col justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 sm:p-3">
          <Skeleton width="46px" height="11px" />
          <Skeleton width="70px" height="18px" borderRadius="4px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Loader for Task Cards List
 */
export function TaskItemsSkeleton({ count = 3 }) {
  return (
    <div className="task-items-list animate-fade-in" style={{ marginTop: '16px' }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          {/* Icon Box */}
          <Skeleton width="42px" height="42px" borderRadius="12px" circle={false} />

          {/* Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="45%" height="15px" borderRadius="4px" />
              <Skeleton width="55px" height="18px" borderRadius="12px" />
            </div>
            <Skeleton width="80%" height="11px" borderRadius="4px" />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
              <Skeleton width="70px" height="10px" borderRadius="4px" />
              <Skeleton width="60px" height="10px" borderRadius="4px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Loader for Expense Items List
 */
export function ExpenseItemsSkeleton({ count = 4 }) {
  return (
    <div className="mt-3 flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
          {/* Avatar / Category Icon */}
          <Skeleton width="42px" height="42px" circle />

          {/* Title & Date */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="50%" height="14px" borderRadius="4px" />
            <Skeleton width="35%" height="10px" borderRadius="4px" />
          </div>

          {/* Amount Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <Skeleton width="64px" height="16px" borderRadius="4px" />
            <Skeleton width="42px" height="9px" borderRadius="3px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Loader for Team Employees Directory
 */
export function EmployeeItemsSkeleton({ count = 5 }) {
  return (
    <div className="flex w-full flex-col divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex w-full items-center gap-3 py-3">
          {/* Profile Avatar */}
          <Skeleton width="46px" height="46px" circle />

          {/* User Name & Role */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="55%" height="14px" borderRadius="4px" />
            <Skeleton width="30%" height="11px" borderRadius="4px" />
          </div>

          {/* Status or Action Badge */}
          <Skeleton width="60px" height="22px" borderRadius="12px" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
