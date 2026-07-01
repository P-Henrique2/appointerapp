import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import type { Appointment } from "../types";

export const QUERY_KEYS = {
  appointments: (accountId: string) => ["appointments", accountId] as const,
  customers:    (accountId: string) => ["customers", accountId] as const,
};

export function useAppointments() {
  const { account } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.appointments(account?.id ?? ""),
    queryFn: async () => {
      if (!account?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*, customers(name, email, phone)")
        .eq("account_id", account.id)
        .order("starts_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data as Appointment[];
    },
    enabled: !!account?.id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAppointment() {
  const { account } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      customer_id: string;
      title: string;
      starts_at: string;
      duration_mins: number;
      notes?: string;
      channel: "sms" | "email" | "both";
      reminder_24h: boolean;
      reminder_2h: boolean;
    }) => {
      if (!account?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("appointments")
        .insert({ account_id: account.id, ...input })
        .select("*, customers(name, email, phone)")
        .single();
      if (error) throw new Error(error.message);
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments(account?.id ?? ""),
      });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const { account } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Appointment["status"] }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id)
        .eq("account_id", account?.id ?? "");
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments(account?.id ?? ""),
      });
    },
  });
}

export function useCustomers() {
  const { account } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.customers(account?.id ?? ""),
    queryFn: async () => {
      if (!account?.id) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("account_id", account.id)
        .order("name");
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!account?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCustomer() {
  const { account } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      email?: string;
      phone?: string;
      notes?: string;
    }) => {
      if (!account?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("customers")
        .insert({ account_id: account.id, ...input })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.customers(account?.id ?? ""),
      });
    },
  });
}