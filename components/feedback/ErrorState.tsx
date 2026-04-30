"use client";

type Props = {
  code?: string;
  message?: string;
  retry?: () => void;
};

export function ErrorState({ code = "UNKNOWN", message = "An error occurred", retry }: Props) {
  return (
    <div className="cp-alert cp-alert--danger" role="alert">
      <div className="cp-alert__icon">!</div>
      <div className="cp-alert__content">
        <p className="cp-alert__title">[{code}]</p>
        <p className="cp-alert__body">{message}</p>
      </div>
      {retry && (
        <button className="cp-btn cp-btn--ghost cp-btn--sm" onClick={retry}>
          RETRY
        </button>
      )}
    </div>
  );
}
