export default function AlertsTable({ data }) {
    if (!data || !data.data) {
        return <div>Loading alerts...</div>;
    }

    const alerts = data.data;

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-500 text-white';
            case 'warning': return 'bg-yellow-500 text-white';
            case 'info': return 'bg-blue-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-900/30 rounded-xl p-4 border border-red-700">
                    <div className="text-red-300 text-sm">Critical</div>
                    <div className="text-3xl font-bold text-white">
                        {alerts.filter(a => a.severity === 'critical').length}
                    </div>
                </div>
                <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-700">
                    <div className="text-yellow-300 text-sm">Warning</div>
                    <div className="text-3xl font-bold text-white">
                        {alerts.filter(a => a.severity === 'warning').length}
                    </div>
                </div>
                <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-700">
                    <div className="text-blue-300 text-sm">Info</div>
                    <div className="text-3xl font-bold text-white">
                        {alerts.filter(a => a.severity === 'info').length}
                    </div>
                </div>
            </div>

            {/* Alerts Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-white">Active Alerts</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                    Severity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                    Device
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                    Value
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                    Region
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                                    Time
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {alerts.map(alert => (
                                <tr key={alert.alert_id} className="hover:bg-slate-700/30 text-white">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">{alert.device_name}</td>
                                    <td className="px-6 py-4 text-sm">{alert.alert_type.replace('_', ' ')}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="text-red-400 font-semibold">{alert.actual_value}</span>
                                        <span className="text-slate-500 text-xs"> / {alert.threshold_value}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm uppercase">{alert.region}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{alert.time_ago}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}