interface WeaponGridProps {
    onReceiveData: (Weapon, number) => void
    weapon: Weapon | undefined
    position: number
    editable: boolean
}