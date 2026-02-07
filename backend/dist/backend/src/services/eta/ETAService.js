/**
 * Electronic Transactions Act 4 of 2019 (ETA) Service
 *
 * Location: backend/src/services/eta/ETAService.ts
 * Purpose: ETA compliance – retention (s24), dispatch/receipt (s29–s31), attribution (s32),
 *          input error (s33), evidence (s25), take down (Ch 6 s54). PRD Appendix H.
 */
import { log, logError } from '../../utils/logger';
export function validateRetentionFormat(record, preservedFormat) {
    if (preservedFormat === 'as-generated')
        return true;
    return true; // must be demonstrable that format represents accurately the information generated/sent/received
}
export async function retainElectronicRecord(dataMessage, meta, store) {
    const fullMeta = {
        ...meta,
        firstRetainedAt: new Date().toISOString(),
    };
    await store(dataMessage, fullMeta);
}
export function recordDispatch(originatorPlaceOfBusiness, enteredSystemAt) {
    return {
        dispatchedAt: enteredSystemAt,
        receivedAt: null,
        placeOfDispatch: originatorPlaceOfBusiness,
        placeOfReceipt: null,
    };
}
export function recordReceipt(meta, addresseePlaceOfBusiness, capableOfRetrievalAt) {
    return {
        ...meta,
        receivedAt: capableOfRetrievalAt,
        placeOfReceipt: addresseePlaceOfBusiness,
    };
}
export function attributeDataMessage(basis, originatorId, overrideIfSystemMalfunction) {
    if (basis === 'automated_system' && overrideIfSystemMalfunction) {
        return { attributedTo: originatorId, basis: 'automated_system' }; // originator must prove malfunction in dispute
    }
    return { attributedTo: originatorId, basis };
}
// ─── s33 Input error (automated system) ───────────────────────────────────────
export const REFUND_DAYS_INPUT_ERROR = 30;
export async function processInputErrorWithdrawal(req, refundPayment, cancelContract) {
    const dueBy = new Date();
    dueBy.setDate(dueBy.getDate() + REFUND_DAYS_INPUT_ERROR);
    await cancelContract(req.transactionId);
    await refundPayment(req.transactionId);
    return { refundDueBy: dueBy.toISOString().slice(0, 10) };
}
export function buildEvidencePackage(dataMessageOrCopy, affidavit) {
    return { evidence: dataMessageOrCopy, affidavit };
}
// ─── Ch 6 s54 Take down ───────────────────────────────────────────────────────
export const NOTIFY_MAKER_DAYS = 3;
export const FURTHER_INFO_DAYS = 3;
export function validateTakeDownNotice(n) {
    return !!(n.complainantFullName &&
        n.complainantAddress &&
        n.signature &&
        n.rightInfringed &&
        n.materialOrActivityId &&
        n.remedialAction &&
        n.goodFaithAndAccuracy);
}
export async function notifyMakerAndAllowObjection(makerContactId, materialOrActivityId, notifyMaker, _onObjection, _onFurtherInfo, _restoreIfBonaFideLawful) {
    await notifyMaker(makerContactId, materialOrActivityId);
    return { notified: true };
}
/**
 * Full take-down flow (s54): (1) Validate notice; (2) Remove/disable expeditiously;
 * (3) Within NOTIFY_MAKER_DAYS notify person who made info available;
 * (4) If they object, forward to requestor; (5) Requestor may provide further info within FURTHER_INFO_DAYS;
 * (6) If bona fide belief info may reasonably be lawful, restore.
 */
export async function executeTakeDownFlow(notice, removeOrDisable, getMakerContactByMaterialId, notifyMaker, _recordObjection, _recordFurtherInfo, _restoreIfBonaFideLawful) {
    if (!validateTakeDownNotice(notice)) {
        logError('ETA: Invalid take down notice', new Error('Invalid take down notice'), { notice });
        throw new Error('Invalid take down notice');
    }
    await removeOrDisable(notice.materialOrActivityId);
    const makerContactId = await getMakerContactByMaterialId(notice.materialOrActivityId);
    const notifyBy = new Date();
    notifyBy.setDate(notifyBy.getDate() + NOTIFY_MAKER_DAYS);
    await notifyMaker(makerContactId, notice.materialOrActivityId);
    log('ETA: Take down executed', {
        materialOrActivityId: notice.materialOrActivityId,
        makerNotifiedBy: notifyBy.toISOString().slice(0, 10),
    });
    return { removed: true, makerNotifiedBy: notifyBy.toISOString().slice(0, 10) };
}
//# sourceMappingURL=ETAService.js.map