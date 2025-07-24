export function calculateLoanDetails(principal, interestRate, repaymentType, loanTerm) {
  const rate = interestRate / 100;
  let totalInterest, totalAmount, installmentAmount, numberOfInstallments, disbursedAmount;

  totalInterest = principal * rate;

  switch (repaymentType) {
    case 'daily':
      numberOfInstallments = 70;
      break;
    
    case 'weekly':
      numberOfInstallments = parseInt(loanTerm) || 10;
      break;
    
    case 'monthly':
      numberOfInstallments = 1;
      break;
    
    default:
      throw new Error('Invalid repayment type');
  }

  totalAmount = principal; 
  installmentAmount = totalAmount / numberOfInstallments;
  disbursedAmount = principal - totalInterest;

  return {
    principal,
    interestRate,
    totalInterest,
    totalAmount,
    disbursedAmount,
    installmentAmount: Math.round(installmentAmount),
    numberOfInstallments,
    repaymentType
  };
}

export function generateRepaymentSchedule(loanDetails, startDate) {
  const schedule = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < loanDetails.numberOfInstallments; i++) {
    const dueDate = new Date(start);
    
    switch (loanDetails.repaymentType) {
      case 'daily':
        dueDate.setDate(start.getDate() + i + 1);
        break;
      case 'weekly':
        dueDate.setDate(start.getDate() + (i + 1) * 7);
        break;
      case 'monthly':
        dueDate.setMonth(start.getMonth() + i + 1);
        break;
    }

    schedule.push({
      installmentNumber: i + 1,
      dueDate: dueDate.toISOString().split('T')[0],
      amount: loanDetails.installmentAmount,
      status: 'pending',
      paidAmount: 0,
      paidDate: null
    });
  }

  return schedule;
}

export function getInterestRate(repaymentType, loanTerm) {
  switch (repaymentType) {
    case 'daily':
      return 20;
    case 'weekly':
      return loanTerm === 1 ? 12 : 20;
    case 'monthly':
      return 20;
    default:
      return 20;
  }
}