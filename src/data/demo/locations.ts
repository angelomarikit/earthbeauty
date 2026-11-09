export type CityNode = { name: string; barangays: string[] }
export type ProvinceNode = { name: string; cities: CityNode[] }
export type RegionNode = { name: string; provinces: ProvinceNode[] }

export const regions: RegionNode[] = [
  {
    name: 'Region IV-A (CALABARZON)',
    provinces: [
      {
        name: 'Laguna',
        cities: [
          { name: 'City of Santa Rosa', barangays: ['Balibago', 'Dila', 'Macabling', 'Market Area', 'Pulong Santa Cruz', 'Kanluran'] },
          { name: 'Biñan', barangays: ['San Antonio', 'Santo Tomas', 'Canlalay'] },
          { name: 'Calamba', barangays: ['Real', 'Parian', 'Barandal'] },
        ],
      },
      {
        name: 'Cavite',
        cities: [
          { name: 'Dasmariñas', barangays: ['Salitran', 'Burol', 'Paliparan'] },
          { name: 'Imus', barangays: ['Alapan', 'Bayan Luma', 'Tanzang Luma'] },
        ],
      },
    ],
  },
  {
    name: 'National Capital Region',
    provinces: [
      {
        name: 'Metro Manila',
        cities: [
          { name: 'Manila', barangays: ['Ermita', 'Malate', 'Sampaloc'] },
          { name: 'Quezon City', barangays: ['Diliman', 'Cubao', 'Novaliches'] },
          { name: 'Makati', barangays: ['Poblacion', 'Bel-Air', 'San Lorenzo'] },
        ],
      },
    ],
  },
  {
    name: 'Region III (Central Luzon)',
    provinces: [
      {
        name: 'Pampanga',
        cities: [{ name: 'San Fernando', barangays: ['Dolores', 'San Jose', 'Telabastagan'] }],
      },
    ],
  },
]
