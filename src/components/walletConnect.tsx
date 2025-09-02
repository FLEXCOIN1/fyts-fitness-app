import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect, useState } from 'react'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'user' | null>(null)
  const [adminList, setAdminList] = useState<string[]>([])
  const [newAdminAddress, setNewAdminAddress] = useState('')
  const [showAddAdmin, setShowAddAdmin] = useState(false)

  // Your wallet address as owner
  const OWNER_ADDRESS = '0xae366Ced6C3D3240D279a5599CCc92fC83e4f675'

  useEffect(() => {
    if (isConnected && address) {
      if (address.toLowerCase() === OWNER_ADDRESS.toLowerCase()) {
        setUserRole('owner')
      } else if (adminList.some(admin => admin.toLowerCase() === address.toLowerCase())) {
        setUserRole('admin')
      } else {
        setUserRole('user')
      }
    } else {
      setUserRole(null)
    }
  }, [address, isConnected, adminList])

  const addAdmin = async (adminAddress: string) => {
    if (!adminAddress) return
    
    // Validate address format
    if (!adminAddress.startsWith('0x') || adminAddress.length !== 42) {
      alert('Invalid wallet address format')
      return
    }

    if (!adminList.includes(adminAddress.toLowerCase())) {
      setAdminList([...adminList, adminAddress.toLowerCase()])
      console.log(`Added admin: ${adminAddress}`)
      // TODO: Call smart contract addAdmin function here
    }
    
    setNewAdminAddress('')
    setShowAddAdmin(false)
  }

  const removeAdmin = (adminAddress: string) => {
    setAdminList(adminList.filter(admin => admin !== adminAddress))
    console.log(`Removed admin: ${adminAddress}`)
    // TODO: Call smart contract removeAdmin function here
  }

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'owner': return { text: 'Protocol Owner', color: '#fbbf24' }
      case 'admin': return { text: 'Network Admin', color: '#8b5cf6' }
      case 'user': return { text: 'Network Validator', color: '#10b981' }
      default: return { text: 'Connect Wallet', color: '#6b7280' }
    }
  }

  const roleInfo = getRoleDisplay()

  if (isConnected) {
    return (
      <div className="wallet-section">
        <div className="wallet-connected">
          <div className="network-status">
            <div className="status-badge" style={{ backgroundColor: roleInfo.color }}>
              {roleInfo.text}
            </div>
            <div className="wallet-address">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
          <button onClick={() => disconnect()} className="disconnect-btn">
            Disconnect
          </button>
        </div>

        {userRole === 'owner' && (
          <div className="admin-management">
            <h4>Admin Management</h4>
            
            <div className="admin-actions">
              <button 
                onClick={() => setShowAddAdmin(!showAddAdmin)}
                className="admin-btn add-admin"
              >
                {showAddAdmin ? 'Cancel' : 'Add Admin'}
              </button>
            </div>

            {showAddAdmin && (
              <div className="add-admin-form">
                <input
                  type="text"
                  placeholder="0x... wallet address"
                  value={newAdminAddress}
                  onChange={(e) => setNewAdminAddress(e.target.value)}
                  className="admin-input"
                />
                <button 
                  onClick={() => addAdmin(newAdminAddress)}
                  className="admin-btn confirm"
                >
                  Add Admin
                </button>
              </div>
            )}

            {adminList.length > 0 && (
              <div className="admin-list">
                <h5>Current Admins:</h5>
                {adminList.map((admin, index) => (
                  <div key={index} className="admin-item">
                    <span className="admin-address">
                      {admin.slice(0, 6)}...{admin.slice(-4)}
                    </span>
                    <button 
                      onClick={() => removeAdmin(admin)}
                      className="admin-btn remove"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(userRole === 'owner' || userRole === 'admin') && (
          <div className="admin-controls">
            <h4>Protocol Controls</h4>
            <div className="control-buttons">
              {userRole === 'owner' && (
                <>
                  <button className="admin-btn emergency">Emergency Pause</button>
                  <button className="admin-btn emergency">Emergency Withdraw</button>
                </>
              )}
              <button className="admin-btn standard">Pause Validations</button>
              <button className="admin-btn standard">View Analytics</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="wallet-section">
      <h3>Connect to FytS Protocol</h3>
      <p className="network-description">
        Connect wallet to access protocol functions
      </p>
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="connect-wallet-btn"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  )
}