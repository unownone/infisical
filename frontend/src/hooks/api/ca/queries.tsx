import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@app/config/request";

import { TCertificateAuthority } from "./types";

export const caKeys = {
  getCaById: (caId: string) => [{ caId }, "ca"],
  getCaCert: (caId: string) => [{ caId }, "ca-cert"],
  getCaCsr: (caId: string) => [{ caId }, "ca-csr"]
};

export const useGetCaById = (caId: string) => {
  return useQuery({
    queryKey: caKeys.getCaById(caId),
    queryFn: async () => {
      const {
        data: { ca }
      } = await apiRequest.get<{ ca: TCertificateAuthority }>(`/api/v1/pki/ca/${caId}`);
      return ca;
    },
    enabled: Boolean(caId)
  });
};

export const useGetCaCert = (caId: string) => {
  return useQuery({
    queryKey: caKeys.getCaCert(caId),
    queryFn: async () => {
      const { data } = await apiRequest.get<{
        certificate: string;
        certificateChain: string;
        serialNumber: string;
      }>(`/api/v1/pki/ca/${caId}/certificate`);
      return data;
    },
    enabled: Boolean(caId)
  });
};

export const useGetCaCsr = (caId: string) => {
  return useQuery({
    queryKey: caKeys.getCaCsr(caId),
    queryFn: async () => {
      const {
        data: { csr }
      } = await apiRequest.get<{
        csr: string;
      }>(`/api/v1/pki/ca/${caId}/csr`);
      return csr;
    },
    enabled: Boolean(caId)
  });
};
