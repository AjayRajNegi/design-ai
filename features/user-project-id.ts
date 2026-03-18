import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// export const useCreateProject = () => {
//   const router = useRouter();

//   return useMutation({
//     mutationFn: async (prompt: string) =>
//       await axios
//         .post("/api/project", {
//           prompt,
//         })
//         .then((res) => res.data),
//     onSuccess: (data) => {
//       router.push(`/project/${data.data.id}`);
//     },
//     onError: (error) => {
//       console.log("Project failed", error);
//       toast.error("Failed to create project.");
//     },
//   });
// };

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
