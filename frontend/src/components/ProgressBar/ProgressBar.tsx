import { Steps } from 'antd';
import type { StepProps } from 'antd';

type StepStatus = 'wait' | 'process' | 'finish' | 'error';

export interface ProgressBarProps {
  currentStep: number;
  className?: string;
}

function getSteps(currentStep: number): StepProps[] {
  return [
    {
      title: 'Upload',
      status: currentStep > 0 ? 'finish' as StepStatus : 
             currentStep === 0 ? 'process' as StepStatus : 
             'wait' as StepStatus
    },
    {
      title: 'Selection',
      status: currentStep > 1 ? 'finish' as StepStatus :
             currentStep === 1 ? 'process' as StepStatus :
             'wait' as StepStatus
    },
    {
      title: 'Review',
      status: currentStep > 2 ? 'finish' as StepStatus :
             currentStep === 2 ? 'process' as StepStatus :
             'wait' as StepStatus
    },
    {
      title: 'Export',
      status: currentStep > 3 ? 'finish' as StepStatus :
             currentStep === 3 ? 'process' as StepStatus :
             'wait' as StepStatus
    }
  ];
}

export function ProgressBar({ currentStep, className = '' }: ProgressBarProps) {
  return (
    <Steps
      current={currentStep}
      className={className}
      items={getSteps(currentStep)}
    />
  );
}

export default ProgressBar; 