import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import { cn } from "@web/lib/utils";
import { useState } from "react";
import RadialProgress from "./RadialProgress";

interface PostWriterProps {
  placeholder?: string;
  maxLength?: number;
}

const PostWriter = ({
  placeholder = "What's on your mind?",
  maxLength = 1024,
}: PostWriterProps) => {
  const [content, setContent] = useState<string>("");

  const queryClient = useQueryClient();

  const postMutation = useMutation({
    mutationFn: () => client.post.post({ content }),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const usedPercent = Math.round((content.length / maxLength) * 100);

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <textarea
          className="textarea textarea-bordered w-full min-h-24 resize-none text-base"
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={maxLength}
        />

        <div className="flex items-center justify-end gap-2 mt-4">
          <RadialProgress
            max={100}
            min={0}
            current={usedPercent}
            showLabel={false}
            size={32}
            strokeWidth={4}
          />

          <button
            onClick={() => postMutation.mutate()}
            disabled={postMutation.isPending || content.length === 0}
            className="btn btn-primary"
            type="button"
          >
            {postMutation.isPending ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostWriter;
