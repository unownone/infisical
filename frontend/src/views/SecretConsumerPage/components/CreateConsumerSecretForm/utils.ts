export function genRange(bottom: number, top: number, reverse: boolean = false): number[] {
    if (bottom > top) {
      return [] as any; // This line will never be executed if the types are used correctly
    }
    // return [];
  
    const numbersArray: number[] = [];
    for (let i = bottom; i <= top; i+=1) {
        console.log(i);
      numbersArray.push(i);
    }

    if (reverse) {
        return numbersArray.reverse();
    }
  
    return numbersArray;
}


export type CardType = "Visa" | "MasterCard" | "American Express" | "Discover" | "Unknown";

function validateCardNumber(cardNumber: string): boolean {
  // Remove all non-digit characters
  const cleaned = cardNumber.replace(/\D/g, "");

  // Luhn algorithm for validation
  let sum = 0;
  let shouldDouble = false;

  for (let i = cleaned.length - 1; i >= 0; i-=1) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function validateCardType(cardNumber: string): CardType {
  // Remove all non-digit characters
  const cleaned = cardNumber.replace(/\D/g, "");

  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned)) {
    return "Visa";
  } if (/^5[1-5][0-9]{14}$/.test(cleaned)) {
    return "MasterCard";
  } if (/^3[47][0-9]{13}$/.test(cleaned)) {
    return "American Express";
  } if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(cleaned)) {
    return "Discover";
  } 
    return "Unknown";
  
}

/**
 * Validate Card Number
 */
export function validateCard(cardNumber: string): { isValid: boolean; cardType: CardType } {
  const isValid = validateCardNumber(cardNumber);
  const cardType = validateCardType(cardNumber);

  return { isValid, cardType };
}