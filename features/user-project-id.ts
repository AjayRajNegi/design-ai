import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useGenerateDesignById = (projectId: string | null) => {
  return useMutation({
    mutationFn: async (prompt: string) =>
      await axios
        .post(`/api/project/${projectId}`, {
          prompt,
        })
        .then((res) => res.data),
    onSuccess: () => {
      toast.success("Generation Started");
    },
    onError: (error) => {
      console.log("Project failed", error);
      toast.error("Failed to generate screen.");
    },
  });
};

export const useGetProjectById = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await axios.get(`/api/project/${projectId}`);
      return res.data;
    },

    enabled: !!projectId,
  });
};
