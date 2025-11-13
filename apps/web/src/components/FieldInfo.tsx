import type { AnyFieldApi } from "@tanstack/react-form";

function FieldInfo({ field }: { field: AnyFieldApi }) {
  const getErrorMessage = () => {
    if (!field.state.meta.errors || field.state.meta.errors.length === 0) {
      return null;
    }

    return field.state.meta.errors
      .map((error) => {
        if (typeof error === "string") {
          return error;
        }

        if (error && typeof error === "object") {
          if ("message" in error && typeof error.message === "string") {
            return error.message;
          }
          return String(error);
        }
        return String(error);
      })
      .join(", ");
  };

  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em className="text-error text-sm">{getErrorMessage()}</em>
      ) : null}
      {field.state.meta.isValidating ? (
        <span className="text-info text-sm">Validating...</span>
      ) : null}
    </>
  );
}

export default FieldInfo;
