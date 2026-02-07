/**
 * Electronic Transactions Act 4 of 2019 (ETA) Service
 *
 * Location: backend/src/services/eta/ETAService.ts
 * Purpose: ETA compliance – retention (s24), dispatch/receipt (s29–s31), attribution (s32),
 *          input error (s33), evidence (s25), take down (Ch 6 s54). PRD Appendix H.
 */
export interface ElectronicRecordRetentionMeta {
    origin: string;
    destination: string;
    generatedAt: string;
    sentOrReceivedAt: string;
    firstRetainedAt: string;
    format: string;
}
export declare function validateRetentionFormat(record: {
    body: unknown;
    meta: ElectronicRecordRetentionMeta;
}, preservedFormat: 'as-generated' | 'can-represent-accurately'): boolean;
export declare function retainElectronicRecord(dataMessage: unknown, meta: Omit<ElectronicRecordRetentionMeta, 'firstRetainedAt'>, store: (data: unknown, meta: ElectronicRecordRetentionMeta) => Promise<void>): Promise<void>;
export interface DispatchReceiptMeta {
    dispatchedAt: string;
    receivedAt: string | null;
    placeOfDispatch: string;
    placeOfReceipt: string | null;
}
export declare function recordDispatch(originatorPlaceOfBusiness: string, enteredSystemAt: string): DispatchReceiptMeta;
export declare function recordReceipt(meta: DispatchReceiptMeta, addresseePlaceOfBusiness: string, capableOfRetrievalAt: string): DispatchReceiptMeta;
export type AttributionBasis = 'personally' | 'authorised_agent' | 'automated_system';
export declare function attributeDataMessage(basis: AttributionBasis, originatorId: string, overrideIfSystemMalfunction?: boolean): {
    attributedTo: string;
    basis: AttributionBasis;
};
export declare const REFUND_DAYS_INPUT_ERROR = 30;
export interface InputErrorWithdrawalRequest {
    userId: string;
    transactionId: string;
    notifiedAt: string;
    wishToCancel: boolean;
    stepsToReturnOrCorrect: string;
}
export declare function processInputErrorWithdrawal(req: InputErrorWithdrawalRequest, refundPayment: (txId: string) => Promise<void>, cancelContract: (txId: string) => Promise<void>): Promise<{
    refundDueBy: string;
}>;
export interface DataMessageAffidavit {
    personInControlOfSystem: string;
    factsReliabilityGeneration: string;
    factsReliabilityIntegrity: string;
    factsOriginatorIdentification: string;
    certifiedCopyOrExtract?: boolean;
}
export declare function buildEvidencePackage(dataMessageOrCopy: unknown, affidavit: DataMessageAffidavit): {
    evidence: unknown;
    affidavit: DataMessageAffidavit;
};
export declare const NOTIFY_MAKER_DAYS = 3;
export declare const FURTHER_INFO_DAYS = 3;
export interface TakeDownNotice {
    complainantFullName: string;
    complainantAddress: string;
    signature: string;
    rightInfringed: string;
    materialOrActivityId: string;
    remedialAction: string;
    contactDetails: string;
    goodFaithAndAccuracy: boolean;
}
export declare function validateTakeDownNotice(n: TakeDownNotice): boolean;
export declare function notifyMakerAndAllowObjection(makerContactId: string, materialOrActivityId: string, notifyMaker: (contactId: string, materialId: string) => Promise<void>, _onObjection: (materialId: string, objectionReason: string) => Promise<void>, _onFurtherInfo: (materialId: string, requestorInfo: string) => Promise<void>, _restoreIfBonaFideLawful: (materialId: string, objectionReceived: boolean, furtherInfoReceived: boolean) => Promise<boolean>): Promise<{
    notified: boolean;
    restored?: boolean;
}>;
/**
 * Full take-down flow (s54): (1) Validate notice; (2) Remove/disable expeditiously;
 * (3) Within NOTIFY_MAKER_DAYS notify person who made info available;
 * (4) If they object, forward to requestor; (5) Requestor may provide further info within FURTHER_INFO_DAYS;
 * (6) If bona fide belief info may reasonably be lawful, restore.
 */
export declare function executeTakeDownFlow(notice: TakeDownNotice, removeOrDisable: (materialId: string) => Promise<void>, getMakerContactByMaterialId: (materialId: string) => Promise<string>, notifyMaker: (contactId: string, materialId: string) => Promise<void>, _recordObjection: (materialId: string, reason: string) => Promise<void>, _recordFurtherInfo: (materialId: string, info: string) => Promise<void>, _restoreIfBonaFideLawful: (materialId: string, objectionReceived: boolean, furtherInfoReceived: boolean) => Promise<boolean>): Promise<{
    removed: boolean;
    makerNotifiedBy: string | null;
}>;
//# sourceMappingURL=ETAService.d.ts.map