'use client';

import { ClimbingBoxLoader } from 'react-spinners';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <ClimbingBoxLoader color="var(--color-accent)" size={14} speedMultiplier={0.9} />
    </div>
  );
}
