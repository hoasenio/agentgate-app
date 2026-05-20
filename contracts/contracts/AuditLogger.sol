// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AuditLogger
/// @notice Immutable on-chain audit trail for AgentGate governed decisions.
///         Event-only design: no storage writes → minimal gas.
///         The full decision payload stays off-chain; only the hash commitment is anchored here.
contract AuditLogger {
    event DecisionRecorded(
        bytes32 indexed proposalHash,
        bytes32 status,
        address indexed approver,
        bytes32 indexed decisionId,
        uint256 timestamp
    );

    function recordDecision(
        bytes32 proposalHash,
        bytes32 status,
        address approver,
        bytes32 decisionId
    ) external {
        emit DecisionRecorded(
            proposalHash,
            status,
            approver,
            decisionId,
            block.timestamp
        );
    }
}
