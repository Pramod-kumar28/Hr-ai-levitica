import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from '../../../shared/components/Modal';

const AssetManagementModal = ({ isOpen, onClose, assets, formatCurrency, onAssetReturn, onAddAsset }) => {
  const [newAsset, setNewAsset] = useState({ assetName: '', assetTag: '', category: 'Laptop' });
  const [isAdding, setIsAdding] = useState(false);

  if (!assets) return null;

  const handleAssetReturn = (assetId, condition) => {
    const asset = assets.allocatedAssets.find(a => a.id === assetId);
    if (asset) {
      const penalty = condition === 'Lost' ? (asset.category === 'Laptop' ? 50000 : asset.category === 'Mobile' ? 20000 : 5000) :
                     condition === 'Damaged' ? (asset.category === 'Laptop' ? 10000 : asset.category === 'Mobile' ? 5000 : 2000) : 0;
      onAssetReturn(assetId, new Date().toISOString().split('T')[0], condition, penalty);
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.assetName.trim()) {
      alert('Please enter an asset name');
      return;
    }
    setIsAdding(true);
    try {
      await onAddAsset?.(newAsset);
      setNewAsset({ assetName: '', assetTag: '', category: 'Laptop' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asset Return Management" size="lg">
      <div className="space-y-6 p-2">
        {onAddAsset && (
          <div className="p-3 border border-dashed border-slate-300 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Asset Name</label>
              <input
                type="text"
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
                value={newAsset.assetName}
                onChange={(e) => setNewAsset({ ...newAsset, assetName: e.target.value })}
                placeholder="e.g. Dell Latitude 5420"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                value={newAsset.category}
                onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
              >
                <option value="Laptop">Laptop</option>
                <option value="Mobile">Mobile</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <button
                type="button"
                className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                onClick={handleAddAsset}
                disabled={isAdding}
              >
                <Icon icon="heroicons:plus" className="w-4 h-4" />
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Asset Name</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Asset Tag</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Category</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">Status</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">Condition</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">Penalty</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.allocatedAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Icon icon="heroicons:cube" className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-slate-800">{asset.assetName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">{asset.assetTag}</code>
                  </td>
                  <td className="px-3 py-2">{asset.category}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      asset.returnStatus === 'returned' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <Icon icon={asset.returnStatus === 'returned' ? 'heroicons:check-circle' : 'heroicons:clock'} className="w-3 h-3" />
                      {asset.returnStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {asset.returnStatus === 'returned' ? (
                      <select
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={asset.condition || 'Good'}
                        onChange={(e) => handleAssetReturn(asset.id, e.target.value)}
                      >
                        <option value="Good">Good</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Lost">Lost</option>
                      </select>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {asset.penalty > 0 ? (
                      <span className="font-semibold text-rose-600">{formatCurrency(asset.penalty)}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {asset.returnStatus === 'pending' && (
                      <button
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-medium transition flex items-center gap-1 mx-auto"
                        onClick={() => handleAssetReturn(asset.id, 'Good')}
                      >
                        <Icon icon="heroicons:check" className="w-3 h-3" />
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h6 className="font-semibold text-sm text-amber-700">Penalty Guidelines</h6>
              <ul className="text-xs text-amber-600 mt-1 space-y-1">
                <li>• Lost: ₹50,000 (Laptop), ₹20,000 (Mobile), ₹5,000 (Others)</li>
                <li>• Damaged: ₹10,000 (Laptop), ₹5,000 (Mobile), ₹2,000 (Others)</li>
                <li>• Pending Return: ₹5,000 (Laptop), ₹2,000 (Mobile), ₹1,000 (Others)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            onClick={onClose}
          >
            <Icon icon="heroicons:calculator" className="w-4 h-4" />
            Recalculate Settlement
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AssetManagementModal;