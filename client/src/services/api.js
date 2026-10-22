const getBaseUrl = () => {
  return 'https://task.cloudastro.space/api';
};

const API_BASE_URL = getBaseUrl();

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getHeaders() {
    const token = localStorage.getItem('office_crm_jwt_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // 0. User Login
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem('office_crm_jwt_token', data.token);
      }
      return data;
    } catch (e) {
      console.warn('Backend login error or offline:', e.message);
      return { success: false, offline: true, message: e.message };
    }
  }

  // 1. Sync Device FCM Token to Server for Killed-App Notifications
  async syncFCMToken(userId, fcmToken) {
    if (!fcmToken || !userId) return;
    try {
      const response = await fetch(`${this.baseUrl}/auth/fcm-token`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, fcmToken })
      });
      return await response.json();
    } catch (e) {
      console.warn('Backend offline or not reachable for FCM sync:', e.message);
    }
  }

  // 2. Tasks
  async getTasks(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${this.baseUrl}/tasks?${query}`, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.tasks || [];
    } catch (e) {
      console.warn('Fallback to local storage tasks:', e.message);
      const local = localStorage.getItem('office_crm_tasks');
      return local ? JSON.parse(local) : [];
    }
  }

  async createTask(taskData) {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(taskData)
      });
      return await response.json();
    } catch (e) {
      console.warn('Backend offline: saving task locally', e.message);
      return { success: false, fallback: true };
    }
  }

  async completeTask(taskId, completionData) {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(completionData)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (completionData?.quickComplete) {
          const fallbackRes = await fetch(`${this.baseUrl}/tasks/${taskId}/quick-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(completionData)
          });
          return await fallbackRes.json();
        }
        throw new Error(data.message || 'Unable to complete task.');
      }
      return data;
    } catch (error) {
      if (completionData?.quickComplete) {
        try {
          const fallbackRes = await fetch(`${this.baseUrl}/tasks/${taskId}/quick-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(completionData)
          });
          return await fallbackRes.json();
        } catch (_) {}
      }
      console.error('Task completion failed:', error.message);
      throw error;
    }
  }

  async snoozeTask(taskId) {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}/quick-snooze`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to snooze task.');
      }
      return data;
    } catch (error) {
      console.error('Task snooze failed:', error.message);
      throw error;
    }
  }

  async sendTaskAlert(taskId) {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}/alert`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Unable to send task alert.');
    }
    return data;
  }

  async deleteTask(taskId) {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (e) {
      console.warn('Backend offline: deleted task locally', e.message);
      return { success: false, fallback: true };
    }
  }

  // 3. Expenses
  async getExpenses(userId) {
    try {
      const url = userId ? `${this.baseUrl}/expenses?userId=${userId}` : `${this.baseUrl}/expenses`;
      const response = await fetch(url, { headers: this.getHeaders() });
      const data = await response.json();
      return data.expenses || [];
    } catch (e) {
      const local = localStorage.getItem('office_crm_expenses_v2');
      return local ? JSON.parse(local) : [];
    }
  }

  async createExpense(expenseData) {
    try {
      const response = await fetch(`${this.baseUrl}/expenses`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(expenseData)
      });
      return await response.json();
    } catch (e) {
      return { success: false, fallback: true };
    }
  }

  async deleteExpense(expenseId) {
    try {
      const response = await fetch(`${this.baseUrl}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (e) {
      return { success: false, fallback: true };
    }
  }

  async issueMoney(issueData) {
    try {
      const response = await fetch(`${this.baseUrl}/expenses/issue-money`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(issueData)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to issue money.');
      }
      return data;
    } catch (error) {
      console.error('Money issue failed:', error.message);
      throw error;
    }
  }

  async getTransactions(employeeId) {
    try {
      const url = employeeId ? `${this.baseUrl}/expenses/transactions?employeeId=${encodeURIComponent(employeeId)}` : `${this.baseUrl}/expenses/transactions`;
      const response = await fetch(url, { headers: this.getHeaders() });
      const data = await response.json();
      return data.transactions || [];
    } catch (e) {
      console.warn('Backend getTransactions error:', e.message);
      return [];
    }
  }

  // 4. Settlements
  async createSettlement(settlementData) {
    try {
      const response = await fetch(`${this.baseUrl}/expenses/settlements`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(settlementData)
      });
      return await response.json();
    } catch (e) {
      return { success: false, fallback: true };
    }
  }

  async getSettlements(employeeId, employeeName) {
    try {
      let query = '';
      if (employeeId) query += `employeeId=${encodeURIComponent(employeeId)}&`;
      if (employeeName) query += `employeeName=${encodeURIComponent(employeeName)}`;
      const response = await fetch(`${this.baseUrl}/expenses/settlements?${query}`, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.settlements || [];
    } catch (e) {
      const local = localStorage.getItem('office_crm_settlements');
      return local ? JSON.parse(local) : [];
    }
  }

  // 5. Users / Employees
  async getUsers() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/users`, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.users || [];
    } catch (e) {
      const local = localStorage.getItem('office_crm_employees');
      return local ? JSON.parse(local) : [];
    }
  }

  async createEmployee(employeeData) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/employees`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(employeeData)
      });
      return await response.json();
    } catch (e) {
      return { success: false, fallback: true };
    }
  }

  async updateEmployee(userId, employeeData) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/employees/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(employeeData)
      });
      return await response.json();
    } catch (e) {
      return { success: false, fallback: true };
    }
  }

  async deleteEmployee(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/employees/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (e) {
      return { success: false, fallback: true };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
