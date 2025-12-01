import { getTournaments } from '@/app/actions'
import DashboardClient from './DashboardClient'

export default async function AdminDashboard() {
    const tournaments = await getTournaments()

    return <DashboardClient tournaments={tournaments} />
}
