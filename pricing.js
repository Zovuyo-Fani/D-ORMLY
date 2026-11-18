// =====================================================
// DORMLY PRICING (one place for every fee calculation)
// Used by booking.html, payment.html, the landlord dashboard and the admin page,
// so a student, an owner and Dormly always see the same numbers.
//
// What a student pays, based on the owner's deposit answer for the property:
//
//   depositRequired === true   Deposit (amount set by the owner, paid to the owner)
//                              + Dormly commission
//   depositRequired === false  Dormly commission
//                              + Booking fee = 10% of the monthly rent, added at the end
//   not answered yet           Dormly commission only (how the site worked before)
//
// "Total due to Dormly" is what the student transfers on the payment page:
// commission + booking fee. The deposit is NOT part of it; it is arranged
// directly between the student and the owner.
// =====================================================

export const COMMISSION_RATE = 0.10;     // Dormly commission, % of the monthly rent
export const BOOKING_FEE_RATE = 0.10;    // booking fee when the owner takes no deposit

// Set to true if the booking fee should REPLACE the commission for no-deposit
// properties (so the student pays one 10% charge instead of two).
export const BOOKING_FEE_REPLACES_COMMISSION = false;

export function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
}

export function money(n) {
    return Number(n || 0).toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export function bookingFeeFor(rent) {
    return round2((Number(rent) || 0) * BOOKING_FEE_RATE);
}

// property = a document from "properties" (or a draft)
export function computeCharges(property) {
    const p = property || {};
    const rent = Number(p.price ?? p.rent ?? 0) || 0;

    let depositRequired = null;                 // null = owner has not answered yet
    if (p.depositRequired === true) depositRequired = true;
    if (p.depositRequired === false) depositRequired = false;

    const depositAmount = depositRequired === true ? round2(p.depositAmount) : 0;
    const bookingFee = depositRequired === false ? bookingFeeFor(rent) : 0;

    let commission = round2(rent * COMMISSION_RATE);
    if (depositRequired === false && BOOKING_FEE_REPLACES_COMMISSION) commission = 0;

    return {
        rent: round2(rent),
        depositRequired,
        depositAmount,
        commission,
        bookingFee,
        totalDueToDormly: round2(commission + bookingFee)
    };
}

// One short sentence describing the owner's deposit choice
export function depositSummary(property) {
    const c = computeCharges(property);
    if (c.depositRequired === true) return "Deposit: R" + money(c.depositAmount);
    if (c.depositRequired === false) return "No deposit (R" + money(c.bookingFee) + " booking fee applies)";
    return "Deposit not set";
}
