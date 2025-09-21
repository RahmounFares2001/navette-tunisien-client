import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  IVehicleResponse,
  ITransferResponse,
  IExcursionResponse,
  IExcursionRequestResponse,
  IDashboardData,
  ListParams,
  CreateTransferRequest,
  UpdateTransferRequest,
  CreateExcursionRequest,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  CreateExcursion,
  IBlogResponse,
  CreateBlogRequest,
  UpdateBlogRequest,
} from '../../../types/types';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE,
    credentials: 'include',
    prepareHeaders: (headers, { endpoint }) => {
      if (endpoint !== 'createVehicle' && endpoint !== 'updateVehicle' && endpoint !== 'createBlog' && endpoint !== 'updateBlog') {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  }),
  tagTypes: ['Vehicle', 'Transfer', 'Excursion', 'ExcursionRequest', 'Blog'],
  endpoints: (builder) => ({
    getAllVehicles: builder.query<{ success: boolean; data: IVehicleResponse[]; currentPage: number; totalPages: number; totalItems: number }, ListParams>({
      query: ({ page = 1, limit = 10 }) => `/api/vehicles?page=${page}&limit=${limit}`,
      providesTags: ['Vehicle'],
    }),
    getVehicle: builder.query<{ success: boolean; data: IVehicleResponse }, string>({
      query: (id) => `/api/vehicles/${id}`,
      providesTags: (result, error, id) => [{ type: 'Vehicle', id }],
    }),
    createVehicle: builder.mutation<{ success: boolean; data: IVehicleResponse; message: string }, FormData>({
      query: (data) => ({
        url: '/api/vehicles',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Vehicle'],
    }),
    updateVehicle: builder.mutation<{ success: boolean; data: IVehicleResponse; message: string }, { id: string; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/api/vehicles/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Vehicle', id }, 'Vehicle'],
    }),
    deleteVehicle: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/api/vehicles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vehicle'],
    }),
    getAllTransfers: builder.query<{
      success: boolean;
      data: ITransferResponse[];
      currentPage: number;
      totalPages: number;
      totalItems: number;
    }, {
      page?: number;
      limit?: number;
      status?: string;
      paymentPercentage?: number;
      search?: string;
    }>({
      query: ({ page = 1, limit = 10, status, paymentPercentage, search }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
    
        if (status) params.append("status", status);
        if (paymentPercentage !== undefined) params.append("paymentPercentage", paymentPercentage.toString());
        if (search) params.append("search", search);
    
        return `/api/transfers?${params.toString()}`;
      },
      providesTags: ["Transfer"],
    }),
    getTransfer: builder.query<{ success: boolean; data: ITransferResponse }, string>({
      query: (id) => `/api/transfers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Transfer', id }],
    }),
    createTransfer: builder.mutation<{ success: boolean; data: ITransferResponse; message: string }, CreateTransferRequest>({
      query: (newTransfer) => ({
        url: '/api/transfers',
        method: 'POST',
        body: newTransfer,
      }),
      invalidatesTags: ['Transfer'],
    }),
    updateTransfer: builder.mutation<{ success: boolean; data: ITransferResponse; message: string }, UpdateTransferRequest>({
      query: ({ id, ...updatedTransfer }) => ({
        url: `/api/transfers/${id}`,
        method: 'PUT',
        body: updatedTransfer,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Transfer', id }, 'Transfer'],
    }),
    deleteTransfer: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/api/transfers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transfer'],
    }),
    getAllExcursions: builder.query<{ success: boolean; data: IExcursionResponse[]; currentPage: number; totalPages: number; totalItems: number }, ListParams>({
      query: ({ page = 1, limit = 10 }) => `/api/excursions?page=${page}&limit=${limit}`,
      providesTags: ['Excursion'],
    }),
    getExcursion: builder.query<{ success: boolean; data: IExcursionResponse }, string>({
      query: (id) => `/api/excursions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Excursion', id }],
    }),
    createExcursion: builder.mutation<{ success: boolean; data: IExcursionResponse; message: string }, CreateExcursion>({
      query: (data) => ({
        url: '/api/excursions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Excursion'],
    }),
    updateExcursion: builder.mutation<{ success: boolean; data: IExcursionResponse; message: string }, { id: string; data: Partial<IExcursionResponse> }>({
      query: ({ id, data }) => ({
        url: `/api/excursions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Excursion', id }, 'Excursion'],
    }),
    deleteExcursion: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/api/excursions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Excursion'],
    }),
    getAllExcursionRequests: builder.query<{
      success: boolean;
      data: IExcursionRequestResponse[];
      currentPage: number;
      totalPages: number;
      totalItems: number;
    }, ListParams>({
      query: ({ page = 1, limit = 10, status, paymentPercentage, search }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
    
        if (status) params.append("status", status);
        if (paymentPercentage !== undefined) params.append("paymentPercentage", paymentPercentage.toString());
        if (search) params.append("search", search);
    
        return `/api/excursion-requests?${params.toString()}`;
      },
      providesTags: ["ExcursionRequest"],
    }),    
    getExcursionRequest: builder.query<{ success: boolean; data: IExcursionRequestResponse }, string>({
      query: (id) => `/api/excursion-requests/${id}`,
      providesTags: (result, error, id) => [{ type: 'ExcursionRequest', id }],
    }),
    createExcursionRequest: builder.mutation<{ success: boolean; data: IExcursionRequestResponse; message: string }, CreateExcursionRequest>({
      query: (data) => ({
        url: '/api/excursion-requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ExcursionRequest'],
    }),
    updateExcursionRequest: builder.mutation<{ success: boolean; data: IExcursionRequestResponse; message: string }, { id: string; data: Partial<CreateExcursionRequest> }>({
      query: ({ id, data }) => ({
        url: `/api/excursion-requests/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ExcursionRequest', id }, 'ExcursionRequest'],
    }),
    deleteExcursionRequest: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/api/excursion-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ExcursionRequest'],
    }),
    getDashboardData: builder.query<{ success: boolean; data: IDashboardData; message: string }, void>({
      query: () => '/api/dashboard',
      providesTags: ['Vehicle', 'Transfer', 'Excursion', 'ExcursionRequest', 'Blog'],
    }),
    getAllBlogs: builder.query<{ success: boolean; data: IBlogResponse[]; currentPage: number; totalPages: number; totalItems: number }, ListParams>({
      query: ({ page = 1, limit = 10, search }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) params.append("search", search);
        return `/api/blogs?${params.toString()}`;
      },
      providesTags: ['Blog'],
    }),
    getBlog: builder.query<{ success: boolean; data: IBlogResponse }, string>({
      query: (id) => `/api/blogs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Blog', id }],
    }),
    createBlog: builder.mutation<{ success: boolean; data: IBlogResponse; message: string }, FormData>({
      query: (data) => ({
        url: '/api/blogs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Blog'],
    }),
    updateBlog: builder.mutation<{ success: boolean; data: IBlogResponse; message: string }, { id: string; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/api/blogs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Blog', id }, 'Blog'],
    }),
    deleteBlog: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/api/blogs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Blog'],
    }),
  }),
});

export const {
  useGetAllVehiclesQuery,
  useGetVehicleQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useGetAllTransfersQuery,
  useGetTransferQuery,
  useCreateTransferMutation,
  useUpdateTransferMutation,
  useDeleteTransferMutation,
  useGetAllExcursionsQuery,
  useGetExcursionQuery,
  useCreateExcursionMutation,
  useUpdateExcursionMutation,
  useDeleteExcursionMutation,
  useGetAllExcursionRequestsQuery,
  useGetExcursionRequestQuery,
  useCreateExcursionRequestMutation,
  useUpdateExcursionRequestMutation,
  useDeleteExcursionRequestMutation,
  useGetDashboardDataQuery,
  useGetAllBlogsQuery,
  useGetBlogQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} = apiSlice;