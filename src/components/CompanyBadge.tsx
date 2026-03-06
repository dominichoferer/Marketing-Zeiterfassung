import { getCompany } from '@/lib/utils';

interface CompanyBadgeProps {
  companyId: string;
  size?: 'sm' | 'md';
}

export default function CompanyBadge({ companyId, size = 'md' }: CompanyBadgeProps) {
  const company = getCompany(companyId);
  if (!company) return <span className="text-slate-400 text-xs">–</span>;

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      }`}
      style={{
        backgroundColor: company.color,
        color: company.textColor,
        borderColor: company.textColor === '#ffffff' ? 'transparent' : '#e2e8f0',
      }}
    >
      {company.name}
    </span>
  );
}
