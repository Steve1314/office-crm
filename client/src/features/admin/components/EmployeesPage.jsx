import React, { useState } from 'react';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup, screenTitle } from '../../../utils/tailwindClasses';
import { ArrowLeft, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import AddEmployeeScreen from './AddEmployeeScreen';
import { EmployeeItemsSkeleton } from '../../../components/common/Skeleton';
import { useLanguage } from '../../../contexts/useLanguage';

export default function EmployeesPage({ 
  onBackToHome, 
  employees: externalEmployees, 
  isLoading = false,
  onAddEmployee: externalOnAddEmployee,
  onUpdateEmployee: externalOnUpdateEmployee,
  onDeleteEmployee: externalOnDeleteEmployee,
  onSelectEmployee
}) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [internalEmployees, setInternalEmployees] = useState(() => {
    const saved = localStorage.getItem('office_crm_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(e => !['Vivek Prajapati', 'Riya Shah', 'Amit Patel', 'Neha Desai', 'Rohit Kumar', 'Pooja Singh'].includes(e.name));
      } catch (e) {}
    }
    return [];
  });

  const employees = externalEmployees || internalEmployees;

  const handleSaveEmployee = (empData) => {
    if (editingEmployee) {
      // Update
      if (externalOnUpdateEmployee) {
        externalOnUpdateEmployee(empData);
      } else {
        const updated = employees.map(e => e.id === empData.id ? empData : e);
        setInternalEmployees(updated);
        localStorage.setItem('office_crm_employees', JSON.stringify(updated));
      }
      setEditingEmployee(null);
    } else {
      // Add
      if (externalOnAddEmployee) {
        externalOnAddEmployee(empData);
      } else {
        const updated = [...employees, empData];
        setInternalEmployees(updated);
        localStorage.setItem('office_crm_employees', JSON.stringify(updated));
      }
      setIsAddingEmployee(false);
    }
  };

  const handleDelete = (emp) => {
    if (window.confirm(`Are you sure you want to delete ${emp.name}?`)) {
      if (externalOnDeleteEmployee) {
        externalOnDeleteEmployee(emp.id);
      } else {
        const updated = employees.filter(e => e.id !== emp.id);
        setInternalEmployees(updated);
        localStorage.setItem('office_crm_employees', JSON.stringify(updated));
      }
    }
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAddingEmployee || editingEmployee) {
    return (
      <AddEmployeeScreen 
        employeeToEdit={editingEmployee}
        onBack={() => {
          setIsAddingEmployee(false);
          setEditingEmployee(null);
        }}
        onSaveEmployee={handleSaveEmployee}
      />
    );
  }

  return (
    <div className={screenFrame}>
      {/* 1. Header with Back Button and Add Plus Button */}
      <header className={screenHeader}>
        <div className={screenHeaderGroup}>
          <button 
            type="button" 
            className={backIconButton}
            onClick={onBackToHome}
            aria-label="Go Back to Home"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className={screenTitle}>{t('Employees')}</h2>
        </div>

        <button 
          type="button" 
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
          onClick={() => setIsAddingEmployee(true)}
          title={t('Add New Employee')}
        >
          <Plus size={20} />
        </button>
      </header>

      {/* 2. Curved White Body */}
      <div className={screenBody}>
        
        {/* Search Employees Input */}
        <div className="relative flex w-full items-center">
          <Search size={18} className="pointer-events-none absolute left-3 text-slate-400" />
          <input 
            type="text"
            className="w-full pl-10"
            placeholder={t('Search by name, role or email...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Employees List or Skeleton */}
        {isLoading ? (
          <EmployeeItemsSkeleton count={5} />
        ) : (
          <div className="flex w-full flex-col divide-y divide-slate-100">
            {filteredEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '14px' }}>
                {searchQuery ? `${t('No employees found matching')} "${searchQuery}".` : t('No employees registered yet. Click + to add an employee.')}
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <div 
                  key={emp.id} 
                  className="flex w-full min-w-0 items-center justify-between gap-3 py-3"
                >
                  {/* Left profile info - clickable to view employee report */}
                  <div 
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                    onClick={() => onSelectEmployee && onSelectEmployee(emp)}
                    style={{ minWidth: 0 }}
                    title={`${t('Click to view')} ${emp.name} ${t('performance report')}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700" aria-hidden="true">
                      {emp.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 className="truncate text-sm font-semibold text-slate-900">
                        {emp.name}
                      </h4>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="text-xs font-medium text-slate-600">{emp.role}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="max-w-full truncate text-xs text-slate-500">
                          {emp.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete buttons */}
                  <div className="ml-1 flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEmployee(emp);
                      }}
                      title={`Edit ${emp.name}`}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(emp);
                      }}
                      title={`Delete ${emp.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
