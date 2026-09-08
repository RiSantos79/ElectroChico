function base(children: React.ReactNode) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4.5">
      {children}
    </svg>
  );
}

export const UserIcon = () =>
  base(
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.6-3.6 4.2-5.4 7-5.4S17.4 16.4 19 20" strokeLinecap="round" />
    </>,
  );

export const HomeIcon = () =>
  base(
    <path
      d="M4 11.5 12 4l8 7.5M6 10v9h5v-5h2v5h5v-9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />,
  );

export const MapPinIcon = () =>
  base(
    <>
      <path d="M12 21s7-6.4 7-11.5a7 7 0 0 0-14 0C5 14.6 12 21 12 21Z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" />
    </>,
  );

export const PhoneIcon = () =>
  base(
    <path
      d="M6 3h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 6.2 2 2 0 0 1 6 3Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />,
  );

export const EnvelopeIcon = () =>
  base(
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );

export const CardIcon = () =>
  base(
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M6.5 14.5h4" strokeLinecap="round" />
    </>,
  );

export const BankIcon = () =>
  base(
    <>
      <path d="M4 10.5 12 5l8 5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5v8h14v-8M9 14v3M15 14v3" strokeLinecap="round" />
      <path d="M3.5 18.5h17" strokeLinecap="round" />
    </>,
  );
