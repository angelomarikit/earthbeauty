import { listBarangays, listMuncities, listProvinces, listRegions } from '@jobuntux/psgc'
import { useMemo, type ReactNode, type Ref } from 'react'

const ALL_REGIONS = listRegions().sort((a, b) => a.regionName.localeCompare(b.regionName))

type PhilippinesAddressFieldsProps = {
  region: string
  province: string
  city: string
  barangay: string
  setValue: (field: 'region' | 'province' | 'city' | 'barangay', value: string) => void
  fieldRef?: (name: 'region' | 'province' | 'city' | 'barangay') => {
    name: string
    onBlur: (event: React.FocusEvent<HTMLSelectElement>) => void
    ref: Ref<HTMLSelectElement>
  }
  errors?: {
    region?: string
    province?: string
    city?: string
    barangay?: string
  }
}

export function PhilippinesAddressFields({
  region,
  province,
  city,
  barangay,
  setValue,
  fieldRef,
  errors,
}: PhilippinesAddressFieldsProps) {
  const regionField = fieldRef?.('region')
  const provinceField = fieldRef?.('province')
  const cityField = fieldRef?.('city')
  const barangayField = fieldRef?.('barangay')
  const regCode = useMemo(() => ALL_REGIONS.find((entry) => entry.regionName === region)?.regCode ?? '', [region])

  const provinces = useMemo(() => {
    if (!regCode) return []
    return listProvinces(regCode).sort((a, b) => a.provName.localeCompare(b.provName))
  }, [regCode])

  const provCode = useMemo(
    () => provinces.find((entry) => entry.provName === province)?.provCode ?? '',
    [provinces, province],
  )

  const cities = useMemo(() => {
    if (!provCode) return []
    return listMuncities(provCode).sort((a, b) => a.munCityName.localeCompare(b.munCityName))
  }, [provCode])

  const munCityCode = useMemo(
    () => cities.find((entry) => entry.munCityName === city)?.munCityCode ?? '',
    [cities, city],
  )

  const barangays = useMemo(() => {
    if (!munCityCode) return []
    return listBarangays(munCityCode).sort((a, b) => a.brgyName.localeCompare(b.brgyName))
  }, [munCityCode])

  return (
    <>
      <div className="grid2">
        <Field label="Region *" error={errors?.region}>
          <select
            className="field-input"
            name={regionField?.name}
            ref={regionField?.ref}
            onBlur={regionField?.onBlur}
            value={region}
            onChange={(event) => {
              setValue('region', event.target.value)
              setValue('province', '')
              setValue('city', '')
              setValue('barangay', '')
            }}
          >
            <option value="">Select region</option>
            {ALL_REGIONS.map((entry) => (
              <option key={entry.regCode} value={entry.regionName}>
                {entry.regionName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Province *" error={errors?.province}>
          <select
            className="field-input"
            disabled={!regCode}
            name={provinceField?.name}
            ref={provinceField?.ref}
            onBlur={provinceField?.onBlur}
            value={province}
            onChange={(event) => {
              setValue('province', event.target.value)
              setValue('city', '')
              setValue('barangay', '')
            }}
          >
            <option value="">{regCode ? 'Select province' : 'Select region first'}</option>
            {provinces.map((entry) => (
              <option key={entry.provCode ?? entry.psgcCode} value={entry.provName}>
                {entry.provName}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid2">
        <Field label="City / Municipality *" error={errors?.city}>
          <select
            className="field-input"
            disabled={!provCode}
            name={cityField?.name}
            ref={cityField?.ref}
            onBlur={cityField?.onBlur}
            value={city}
            onChange={(event) => {
              setValue('city', event.target.value)
              setValue('barangay', '')
            }}
          >
            <option value="">{provCode ? 'Select city or municipality' : 'Select province first'}</option>
            {cities.map((entry) => (
              <option key={entry.munCityCode} value={entry.munCityName}>
                {entry.munCityName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Barangay *" error={errors?.barangay}>
          <select
            className="field-input"
            disabled={!munCityCode}
            name={barangayField?.name}
            ref={barangayField?.ref}
            onBlur={barangayField?.onBlur}
            value={barangay}
            onChange={(event) => setValue('barangay', event.target.value)}
          >
            <option value="">{munCityCode ? 'Select barangay' : 'Select city first'}</option>
            {barangays.map((entry) => (
              <option key={entry.brgyCode} value={entry.brgyName}>
                {entry.brgyName}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="muted tiny" style={{ margin: '0 0 4px', lineHeight: 1.5 }}>
        Nationwide delivery — address options use the official PSA geographic codes (PSGC).
      </p>
    </>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="form-group">
      <label className="fieldlabel">{label}</label>
      {children}
      {error ? <div className="form-error">{error}</div> : null}
    </div>
  )
}
