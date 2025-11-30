import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@web/lib/api-client";
import { cn } from "@web/lib/utils";
import { useState, useRef } from "react";
import RadialProgress from "../RadialProgress";
import { ImagePlus, X } from "lucide-react";
import Avatar from "../avatar/Avatar";
import { useSession } from "@web/lib/auth-client";

interface PostWriterProps {
  placeholder?: string;
  maxLength?: number;
}

interface UploadedImage {
  id: string;
  url: string;
  file: File;
}

const MAX_IMAGES = 4;

const PostWriter = ({
  placeholder = "What's on your mind?",
  maxLength = 1024,
}: PostWriterProps) => {
  const [content, setContent] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useSession();

  const queryClient = useQueryClient();

  const postMutation = useMutation({
    mutationFn: async () => {
      //upload images if any
      let imageIds: string[] = [];

      if (selectedFiles.length > 0) {
        setIsUploading(true);
        try {
          const { data, error } = await client.api.upload.postimages.post({
            files: selectedFiles,
          });

          if (error || !data) {
            throw new Error("Failed to upload images");
          }

          imageIds = data.images.map((img: { id: string }) => img.id);
        } finally {
          setIsUploading(false);
        }
      }

      // create the post with image IDs
      return await client.api.posts.post({ content, imageIds });
    },
    onSuccess: () => {
      setContent("");
      setSelectedFiles([]);
      setUploadedImages([]);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_IMAGES - selectedFiles.length;
    const newFiles = files.slice(0, remainingSlots);

    const newPreviews = newFiles.map((file) => ({
      id: URL.createObjectURL(file),
      url: URL.createObjectURL(file),
      file,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setUploadedImages((prev) => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(uploadedImages[index].url);

    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const usedPercent = Math.round((content.length / maxLength) * 100);
  const canAddMoreImages = selectedFiles.length < MAX_IMAGES;
  const hasContent = content.length > 0 || selectedFiles.length > 0;

  return (
    <div className="mb-4 flex gap-4 rounded-md border-base-300 border-b p-4">
      <div>
        <Avatar
          name={data?.user.name || "User"}
          image={data?.user.image || null}
          size="md"
        />
      </div>

      <div className="flex w-full flex-col gap-2">
        <textarea
          className="textarea textarea-bordered min-h-24 w-full resize-none text-base"
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={maxLength}
          spellCheck={false}
        />

        {/* Image Previews */}
        {uploadedImages.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {uploadedImages.map((image, index) => (
              <div key={image.id} className="relative">
                <img
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  className="h-32 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="btn btn-circle btn-error btn-xs absolute top-1 right-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          {/* Image Upload Button */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={!canAddMoreImages}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAddMoreImages}
              className={cn(
                "btn btn-ghost btn-sm",
                !canAddMoreImages && "btn-disabled",
              )}
              title={
                canAddMoreImages ? "Add images" : `Maximum ${MAX_IMAGES} images`
              }
            >
              <ImagePlus className="h-5 w-5" />
              {selectedFiles.length > 0 && (
                <span className="text-xs">
                  {selectedFiles.length}/{MAX_IMAGES}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
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
              disabled={postMutation.isPending || isUploading || !hasContent}
              className="btn btn-primary"
              type="button"
            >
              {isUploading
                ? "Uploading..."
                : postMutation.isPending
                  ? "Posting..."
                  : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostWriter;
