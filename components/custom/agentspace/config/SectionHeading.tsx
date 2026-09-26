type SectionHeadingProps = {
  title: string;
  detail?: string;
};

export function SectionHeading({ title, detail }: SectionHeadingProps) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {detail && (
        <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
      )}
    </div>
  );
}
