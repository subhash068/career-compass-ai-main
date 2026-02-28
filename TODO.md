# Blockchain Certificate Anchoring - Implementation TODO

## Phase 1: Database & Model Updates
- [x] 1.1 Update requirements.txt with web3 dependency
- [x] 1.2 Create migration 009_add_blockchain_fields.py
- [x] 1.3 Update Certificate model with blockchain fields

## Phase 2: Backend Service
- [x] 2.1 Create blockchain_service.py
- [x] 2.2 Update certificate routes with blockchain endpoints
- [x] 2.3 Update verification to check blockchain

## Phase 3: Frontend Updates
- [x] 3.1 Update VerifyCertificate.tsx with blockchain display

## Phase 4: Testing (Manual Steps)
- [ ] 4.1 Run migration: python run_migration.py
- [ ] 4.2 Install dependencies: pip install web3 eth-account
- [ ] 4.3 Test certificate generation with blockchain anchoring
- [ ] 4.4 Test verification flow
