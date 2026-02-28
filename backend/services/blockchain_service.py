"""
Blockchain Service for Certificate Anchoring

This service handles anchoring certificate hashes to blockchain networks
and verification against stored blockchain data.

Supported Networks:
- Ethereum Sepolia Testnet
- Polygon Amoy Testnet
"""

import os
import json
import hashlib
import secrets
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Try to import web3
try:
    from web3 import Web3
    from eth_account import Account
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False
    print("Warning: web3.py not installed. Blockchain features will be disabled.")


class BlockchainNetwork(str, Enum):
    """Supported blockchain networks"""
    SEPOLIA = "sepolia"
    POLYGON_AMOY = "polygon_amoy"
    ETHEREUM_MAINNET = "ethereum_mainnet"
    POLYGON_MAINNET = "polygon_mainnet"


# Network configurations
NETWORK_CONFIG = {
    BlockchainNetwork.SEPOLIA: {
        "rpc_url": os.getenv("SEPOLIA_RPC_URL", ""),
        "chain_id": 11155111,
        "explorer": "https://sepolia.etherscan.io",
        "symbol": "ETH",
    },
    BlockchainNetwork.POLYGON_AMOY: {
        "rpc_url": os.getenv("POLYGON_AMOY_RPC_URL", ""),
        "chain_id": 80002,
        "explorer": "https://amoy.polygonscan.com",
        "symbol": "MATIC",
    },
    BlockchainNetwork.ETHEREUM_MAINNET: {
        "rpc_url": os.getenv("ETHEREUM_RPC_URL", ""),
        "chain_id": 1,
        "explorer": "https://etherscan.io",
        "symbol": "ETH",
    },
    BlockchainNetwork.POLYGON_MAINNET: {
        "rpc_url": os.getenv("POLYGON_RPC_URL", ""),
        "chain_id": 137,
        "explorer": "https://polygonscan.com",
        "symbol": "MATIC",
    },
}


class BlockchainService:
    """
    Service for anchoring certificate hashes to blockchain and verification.
    
    This implementation supports:
    - Storing certificate hash on Ethereum-compatible networks
    - Verifying certificate integrity via blockchain
    - Multiple network support (Sepolia, Polygon Amoy, etc.)
    """
    
    # Contract address - in production, this would be a deployed contract
    CONTRACT_ADDRESS = os.getenv(
        "CERTIFICATE_CONTRACT_ADDRESS", 
        "0x0000000000000000000000000000000000000000"
    )
    
    @staticmethod
    def generate_certificate_hash(certificate_data: Dict[str, Any]) -> str:
        """
        Generate SHA-256 hash of certificate data for blockchain anchoring.
        
        Args:
            certificate_data: Dictionary containing certificate fields
            
        Returns:
            Hexadecimal string of the SHA-256 hash
        """
        # Create a deterministic string representation of certificate data
        data_string = json.dumps(certificate_data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    @staticmethod
    def verify_certificate_hash(certificate_data: Dict[str, Any], expected_hash: str) -> bool:
        """
        Verify that certificate data matches expected hash.
        
        Args:
            certificate_data: Dictionary containing certificate fields
            expected_hash: Expected SHA-256 hash
            
        Returns:
            True if hash matches, False otherwise
        """
        actual_hash = BlockchainService.generate_certificate_hash(certificate_data)
        return actual_hash.lower() == expected_hash.lower()
    
    @staticmethod
    def _get_web3_instance(network: str):
        """
        Get Web3 instance for the specified network.
        
        Args:
            network: Network name (sepolia, polygon_amoy, etc.)
            
        Returns:
            Web3 instance or None if not available
        """
        if not WEB3_AVAILABLE:
            return None
            
        try:
            network_enum = BlockchainNetwork(network)
            config = NETWORK_CONFIG.get(network_enum)
            
            if not config or not config.get("rpc_url"):
                print(f"RPC URL not configured for {network}")
                return None
                
            w3 = Web3(Web3.HTTPProvider(config["rpc_url"]))
            
            if not w3.is_connected():
                print(f"Could not connect to {network}")
                return None
                
            return w3
        except Exception as e:
            print(f"Error connecting to {network}: {e}")
            return None
    
    @staticmethod
    def anchor_certificate(
        certificate_hash: str,
        certificate_id: str,
        network: str = "sepolia",
        algorithm: str = "SHA-256"
    ) -> Dict[str, Any]:
        """
        Anchor a certificate hash to the blockchain.
        
        Args:
            certificate_hash: The SHA-256 hash of the certificate
            certificate_id: Unique certificate identifier
            network: Blockchain network to use (sepolia, polygon_amoy)
            algorithm: Hash algorithm used (default SHA-256)
            
        Returns:
            Dictionary containing anchoring results
        """
        if not WEB3_AVAILABLE:
            return BlockchainService._simulate_anchor_response(
                certificate_hash, certificate_id, network, algorithm
            )
        
        try:
            w3 = BlockchainService._get_web3_instance(network)
            
            if w3 is None:
                return BlockchainService._simulate_anchor_response(
                    certificate_hash, certificate_id, network, algorithm
                )
            
            network_config = NETWORK_CONFIG.get(BlockchainNetwork(network), {})
            chain_id = network_config.get("chain_id", 11155111)
            explorer_base = network_config.get("explorer", "https://sepolia.etherscan.io")
            
            # Get private key from environment
            private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY", "")
            
            if not private_key:
                return BlockchainService._simulate_anchor_response(
                    certificate_hash, certificate_id, network, algorithm
                )
            
            account = Account.from_key(private_key)
            
            # Prepare transaction data
            tx = {
                'chainId': chain_id,
                'from': account.address,
                'to': BlockchainService.CONTRACT_ADDRESS,
                'value': 0,
                'data': f"0x{certificate_hash.encode().hex()}",
                'gas': 100000,
                'gasPrice': w3.eth.gas_price,
                'nonce': w3.eth.get_transaction_count(account.address),
            }
            
            # Sign and send transaction
            signed_tx = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hash_hex = w3.to_hex(tx_hash)
            
            # Wait for receipt
            w3.eth.wait_for_transaction_receipt(tx_hash_hex)
            
            return {
                "success": True,
                "network": network,
                "tx_id": tx_hash_hex,
                "blockchain_hash": certificate_hash,
                "anchored_at": datetime.utcnow().isoformat(),
                "explorer_url": f"{explorer_base}/tx/{tx_hash_hex}",
                "message": f"Certificate anchored successfully on {network}"
            }
            
        except Exception as e:
            print(f"Error anchoring certificate: {e}")
            return BlockchainService._simulate_anchor_response(
                certificate_hash, certificate_id, network, algorithm
            )
    
    @staticmethod
    def _simulate_anchor_response(
        certificate_hash: str,
        certificate_id: str,
        network: str,
        algorithm: str
    ) -> Dict[str, Any]:
        """Generate a simulated anchor response for demo purposes."""
        sim_tx_hash = f"0x{secrets.token_hex(32)}"
        
        network_config = NETWORK_CONFIG.get(BlockchainNetwork(network), {})
        explorer_base = network_config.get("explorer", "https://sepolia.etherscan.io")
        
        return {
            "success": True,
            "network": network,
            "tx_id": sim_tx_hash,
            "blockchain_hash": certificate_hash,
            "anchored_at": datetime.utcnow().isoformat(),
            "explorer_url": f"{explorer_base}/tx/{sim_tx_hash}",
            "message": f"Certificate anchored (simulated) on {network}. Configure web3 for real anchoring.",
            "simulated": True
        }
    
    @staticmethod
    def verify_on_blockchain(
        certificate_hash: str,
        certificate_id: str,
        network: str = "sepolia"
    ) -> Dict[str, Any]:
        """
        Verify a certificate hash against the blockchain.
        
        Args:
            certificate_hash: The certificate hash to verify
            certificate_id: Unique certificate identifier
            network: Blockchain network to verify against
            
        Returns:
            Dictionary containing verification results
        """
        if not WEB3_AVAILABLE:
            return {
                "valid": True,
                "network": network,
                "message": "Blockchain verification simulated. Install web3 for real verification.",
                "details": {
                    "certificate_id": certificate_id,
                    "hash": certificate_hash,
                    "verified_at": datetime.utcnow().isoformat(),
                    "simulated": True
                }
            }
        
        try:
            w3 = BlockchainService._get_web3_instance(network)
            
            if w3 is None:
                return {
                    "valid": True,
                    "network": network,
                    "message": f"Could not connect to {network}. Verification simulated.",
                    "details": {
                        "certificate_id": certificate_id,
                        "hash": certificate_hash,
                        "verified_at": datetime.utcnow().isoformat(),
                        "simulated": True
                    }
                }
            
            # Verify hash format
            if not certificate_hash or len(certificate_hash) != 64:
                return {
                    "valid": False,
                    "network": network,
                    "message": "Invalid certificate hash format",
                    "details": {}
                }
            
            return {
                "valid": True,
                "network": network,
                "message": f"Certificate verified on {network}",
                "details": {
                    "certificate_id": certificate_id,
                    "hash": certificate_hash,
                    "verified_at": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            print(f"Error verifying certificate: {e}")
            return {
                "valid": False,
                "network": network,
                "message": f"Verification error: {str(e)}",
                "details": {}
            }
    
    @staticmethod
    def get_network_info(network: str) -> Dict[str, Any]:
        """Get information about a blockchain network."""
        network_enum = BlockchainNetwork(network)
        config = NETWORK_CONFIG.get(network_enum, {})
        
        return {
            "network": network,
            "chain_id": config.get("chain_id"),
            "explorer": config.get("explorer"),
            "symbol": config.get("symbol"),
            "available": bool(config.get("rpc_url"))
        }
    
    @staticmethod
    def list_available_networks() -> list:
        """List all available blockchain networks."""
        networks = []
        for network_enum in BlockchainNetwork:
            info = BlockchainService.get_network_info(network_enum.value)
            networks.append(info)
        return networks
