import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentRepository } from '../repositories/department-repository';
import { employeeRepository } from '../repositories/employee-repository';
import { HRNotificationService } from '../services/hr-notification-service';
import type {
  DepartmentResponseDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentQueryDto,
} from '../types/department';
import type {
  EmployeeResponseDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto,
} from '../types/employee';
import type { PaginatedResponse, BulkOperationResult } from '../types/common';

export const hrKeys = {
  departments: {
    all: ['hr', 'departments'] as const,
    list: (query: Partial<DepartmentQueryDto> = {}) => ['hr', 'departments', 'list', query] as const,
    detail: (id: string) => ['hr', 'departments', 'detail', id] as const,
    hierarchy: () => ['hr', 'departments', 'hierarchy'] as const,
    stats: () => ['hr', 'departments', 'stats'] as const,
  },
  employees: {
    all: ['hr', 'employees'] as const,
    list: (query: Partial<EmployeeQueryDto> = {}) => ['hr', 'employees', 'list', query] as const,
    detail: (id: string) => ['hr', 'employees', 'detail', id] as const,
  },
};

// Departments
export const useDepartments = (query: Partial<DepartmentQueryDto> = {}) => {
  return useQuery<PaginatedResponse<DepartmentResponseDto>>({
    queryKey: hrKeys.departments.list(query),
    queryFn: () => departmentRepository.getDepartments(query),
    placeholderData: (prev) => prev,
  });
};

export const useDepartment = (id: string, enabled = true) => {
  return useQuery<DepartmentResponseDto>({
    queryKey: hrKeys.departments.detail(id),
    queryFn: () => departmentRepository.getById(id),
    enabled: !!id && enabled,
  });
};

export const useDepartmentHierarchy = () => {
  return useQuery<DepartmentResponseDto[]>({
    queryKey: hrKeys.departments.hierarchy(),
    queryFn: () => departmentRepository.getHierarchy(),
  });
};

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepartmentDto) => departmentRepository.create(payload),
    onSuccess: (dept) => {
      qc.invalidateQueries({ queryKey: hrKeys.departments.all });
      HRNotificationService.departmentCreated(dept.departmentName?.en);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to create department';
      HRNotificationService.showCreateError(msg, 'Department');
    }
  });
};

export const useUpdateDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentDto }) => departmentRepository.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: hrKeys.departments.list({}) });
      qc.invalidateQueries({ queryKey: hrKeys.departments.detail(updated.id) });
      HRNotificationService.departmentUpdated(updated.departmentName?.en);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to update department';
      HRNotificationService.showUpdateError(msg, 'Department');
    }
  });
};

export const useDeleteDepartment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hrKeys.departments.all });
      HRNotificationService.departmentDeleted('Department');
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to delete department';
      HRNotificationService.showDeleteError(msg, 'Department');
    }
  });
};

export const useDepartmentBulkActivate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => departmentRepository.bulkActivate(ids),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: hrKeys.departments.all });
      HRNotificationService.departmentBulk('Activated', variables?.length ?? 0);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to bulk activate departments';
      HRNotificationService.showUpdateError(msg, 'Departments');
    }
  });
};

export const useDepartmentBulkDeactivate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => departmentRepository.bulkDeactivate(ids),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: hrKeys.departments.all });
      HRNotificationService.departmentBulk('Deactivated', variables?.length ?? 0);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to bulk deactivate departments';
      HRNotificationService.showUpdateError(msg, 'Departments');
    }
  });
};

export const useDepartmentBulkDelete = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => departmentRepository.bulkDelete(ids),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: hrKeys.departments.all });
      HRNotificationService.departmentBulk('Deleted', variables?.length ?? 0);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to bulk delete departments';
      HRNotificationService.showDeleteError(msg, 'Departments');
    }
  });
};

// Employees
export const useEmployees = (query: Partial<EmployeeQueryDto> = {}) => {
  return useQuery<PaginatedResponse<EmployeeResponseDto>>({
    queryKey: hrKeys.employees.list(query),
    queryFn: () => employeeRepository.getEmployees(query),
    placeholderData: (prev) => prev,
  });
};

export const useEmployee = (id: string, enabled = true) => {
  return useQuery<EmployeeResponseDto>({
    queryKey: hrKeys.employees.detail(id),
    queryFn: () => employeeRepository.getById(id),
    enabled: !!id && enabled,
  });
};

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeDto) => employeeRepository.create(payload),
    onSuccess: (emp) => {
      qc.invalidateQueries({ queryKey: hrKeys.employees.all });
      HRNotificationService.employeeCreated(emp.name?.en);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to create employee';
      HRNotificationService.showCreateError(msg, 'Employee');
    }
  });
};

export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) => employeeRepository.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: hrKeys.employees.list({}) });
      qc.invalidateQueries({ queryKey: hrKeys.employees.detail(updated.id) });
      HRNotificationService.employeeUpdated(updated.name?.en);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to update employee';
      HRNotificationService.showUpdateError(msg, 'Employee');
    }
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hrKeys.employees.all });
      HRNotificationService.employeeDeleted('Employee');
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to delete employee';
      HRNotificationService.showDeleteError(msg, 'Employee');
    }
  });
};

export const useEmployeeBulkActivate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => employeeRepository.bulkActivate(ids),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: hrKeys.employees.all });
    HRNotificationService.employeeBulk('Activated', variables?.length ?? 0);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to bulk activate employees';
      HRNotificationService.showUpdateError(msg, 'Employees');
    }
  });
};

export const useEmployeeBulkDeactivate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => employeeRepository.bulkDeactivate(ids),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: hrKeys.employees.all });
      HRNotificationService.employeeBulk('Deactivated', variables?.length ?? 0);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to bulk deactivate employees';
      HRNotificationService.showUpdateError(msg, 'Employees');
    }
  });
};

export const useEmployeeBulkDelete = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => employeeRepository.bulkDelete(ids),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: hrKeys.employees.all });
      HRNotificationService.employeeBulk('Deleted', variables?.length ?? 0);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to bulk delete employees';
      HRNotificationService.showDeleteError(msg, 'Employees');
    }
  });
};

// Employee Photo Operations - Updated to use correct file field names
export const useUploadEmployeePhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      
      // Debug logging
      console.log('Creating FormData for employee photo upload:', { id, file });
      
      // Use 'image' field name to match backend FileFieldsInterceptor
      formData.append('image', file);
      
      // Debug logging
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      return employeeRepository.uploadPhoto(id, formData);
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: hrKeys.employees.list({}) });
      qc.invalidateQueries({ queryKey: hrKeys.employees.detail(updated.id) });
      HRNotificationService.employeePhotoUploaded(updated.name?.en);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to upload employee photo';
      HRNotificationService.showPhotoUploadError(msg, 'Employee');
    }
  });
};

export const useRemoveEmployeePhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeRepository.removePhoto(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: hrKeys.employees.list({}) });
      qc.invalidateQueries({ queryKey: hrKeys.employees.detail(updated.id) });
      HRNotificationService.employeePhotoRemoved(updated.name?.en);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to remove employee photo';
      HRNotificationService.showPhotoRemovalError(msg, 'Employee');
    }
  });
};

export const useCreateEmployeeWithPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, data }: { file: File; data: CreateEmployeeDto }) => {
      const formData = new FormData();
      
      // Debug logging
      console.log('Creating FormData for employee with photo:', { file, data });
      
      // Use 'image' field name to match backend FileFieldsInterceptor
      formData.append('image', file);
      
      // Add form data fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'name') {
          formData.append('name[en]', value.en || '');
          formData.append('name[ne]', value.ne || '');
        } else if (key === 'position') {
          formData.append('position[en]', value.en || '');
          formData.append('position[ne]', value.ne || '');
        } else {
          formData.append(key, String(value));
        }
      });

      // Debug logging
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      return employeeRepository.createWithPhoto(formData);
    },
    onSuccess: (emp) => {
      qc.invalidateQueries({ queryKey: hrKeys.employees.all });
      HRNotificationService.employeeCreatedWithPhoto(emp.name?.en);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to create employee with photo';
      HRNotificationService.showCreateError(msg, 'Employee');
    }
  });
};


