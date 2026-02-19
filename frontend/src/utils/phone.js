export const PHONE_COUNTRIES = [
  { iso: "PE", name: "Peru", flag: "🇵🇪", dialCode: "51", digits: 9 },
  { iso: "CL", name: "Chile", flag: "🇨🇱", dialCode: "56", digits: 9 },
  { iso: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "57", digits: 10 },
  { iso: "EC", name: "Ecuador", flag: "🇪🇨", dialCode: "593", digits: 9 },
  { iso: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "52", digits: 10 },
  { iso: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "1", digits: 10 }
];

export const DEFAULT_PHONE_COUNTRY = "PE";

export const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

export const getPhoneCountry = (iso) =>
  PHONE_COUNTRIES.find((country) => country.iso === iso) || PHONE_COUNTRIES[0];

export const validatePhone = (countryIso, number) => {
  const country = getPhoneCountry(countryIso);
  const digits = onlyDigits(number);
  if (!digits) {
    return { ok: false, error: "El teléfono es obligatorio." };
  }
  if (digits.length !== country.digits) {
    return {
      ok: false,
      error: `El teléfono para ${country.name} debe tener ${country.digits} dígitos.`
    };
  }
  return { ok: true, digits, country };
};

export const buildPhoneValue = (countryIso, number) => {
  const validation = validatePhone(countryIso, number);
  if (!validation.ok) return validation;
  const { country, digits } = validation;
  return {
    ok: true,
    e164: `+${country.dialCode}${digits}`,
    local: digits,
    country
  };
};

export const splitPhoneValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return { countryIso: DEFAULT_PHONE_COUNTRY, number: "" };
  const digits = onlyDigits(raw);
  for (const country of PHONE_COUNTRIES) {
    if (digits.startsWith(country.dialCode)) {
      const local = digits.slice(country.dialCode.length);
      if (local.length === country.digits) {
        return { countryIso: country.iso, number: local };
      }
    }
  }
  return { countryIso: DEFAULT_PHONE_COUNTRY, number: digits };
};
