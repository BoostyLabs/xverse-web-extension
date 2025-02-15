import ledgerConnectDefaultIcon from '@assets/img/ledger/ledger_connect_default.svg';
import ledgerConnectBtcIcon from '@assets/img/ledger/ledger_import_connect_btc.svg';
import { delay } from '@common/utils/ledger';
import ConfirmScreen from '@components/confirmScreen';
import InfoContainer from '@components/infoContainer';
import LedgerConnectionView from '@components/ledger/connectLedgerView';
import TopRow from '@components/topRow';
import useRunesApi from '@hooks/apiClients/useRunesApi';
import useSeedVault from '@hooks/useSeedVault';
import useSelectedAccount from '@hooks/useSelectedAccount';
import useWalletSelector from '@hooks/useWalletSelector';
import Transport from '@ledgerhq/hw-transport-webusb';
import CollapsableContainer from '@screens/signatureRequest/collapsableContainer';
import SignatureRequestMessage from '@screens/signatureRequest/signatureRequestMessage';
import { bip0322Hash, MessageSigningProtocols, signMessage } from '@secretkeylabs/xverse-core';
import Button from '@ui-library/button';
import Sheet from '@ui-library/sheet';
import { getTruncatedAddress, isHardwareAccount } from '@utils/helper';
import { handleLedgerMessageSigning } from '@utils/ledger';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ActionDisclaimer,
  MainContainer,
  MessageHash,
  RequestType,
  SigningAddress,
  SigningAddressContainer,
  SigningAddressTitle,
  SigningAddressType,
  SigningAddressValue,
  SuccessActionsContainer,
} from '../signMessageRequest/index.styled';

function SignMessageRequestInApp() {
  const { t } = useTranslation('translation');
  const { accountsList, network } = useWalletSelector();
  const selectedAccount = useSelectedAccount();
  const location = useLocation();
  const { payload } = location.state?.requestPayload || {};
  const navigate = useNavigate();
  const { getSeed } = useSeedVault();
  const runesApi = useRunesApi();

  const [addressType, setAddressType] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  // Ledger state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConnectSuccess, setIsConnectSuccess] = useState(false);
  const [isConnectFailed, setIsConnectFailed] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTxRejected, setIsTxRejected] = useState(false);
  const [isTxInvalid, setIsTxInvalid] = useState(false);

  useEffect(() => {
    const checkAddressAvailability = () => {
      const account = accountsList.filter((acc) => {
        if (acc.btcAddress === payload.address) {
          setAddressType(t('SIGNATURE_REQUEST.SIGNING_ADDRESS_SEGWIT'));
          return true;
        }
        if (acc.ordinalsAddress === payload?.address) {
          setAddressType(t('SIGNATURE_REQUEST.SIGNING_ADDRESS_TAPROOT'));
          return true;
        }
        return false;
      });
      return isHardwareAccount(selectedAccount) ? account[0] || selectedAccount : account[0];
    };
    checkAddressAvailability();
  }, [accountsList, payload, selectedAccount, t]);

  const getConfirmationError = (type: 'title' | 'subtitle') => {
    if (type === 'title') {
      if (isTxRejected) {
        return t('SIGNATURE_REQUEST.LEDGER.CONFIRM.DENIED.ERROR_TITLE');
      }

      if (isTxInvalid) {
        return t('SIGNATURE_REQUEST.LEDGER.CONFIRM.INVALID.ERROR_TITLE');
      }

      return t('SIGNATURE_REQUEST.LEDGER.CONFIRM.ERROR_TITLE');
    }

    if (isTxRejected) {
      return t('SIGNATURE_REQUEST.LEDGER.CONFIRM.DENIED.ERROR_SUBTITLE');
    }

    if (isTxInvalid) {
      return t('SIGNATURE_REQUEST.LEDGER.CONFIRM.INVALID.ERROR_SUBTITLE');
    }

    return t('SIGNATURE_REQUEST.LEDGER.CONFIRM.ERROR_SUBTITLE');
  };

  const handleCancelClick = () => {
    navigate(`/coinDashboard/FT?ftKey=${payload.selectedRuneId}&protocol=runes`);
  };

  const handleRetry = async () => {
    setIsTxRejected(false);
    setIsTxInvalid(false);
    setIsConnectFailed(false);
    setIsConnectSuccess(false);
    setCurrentStepIndex(0);
  };

  const handleGoBack = () => navigate(-1);

  const handleConnectAndConfirm = async () => {
    if (!selectedAccount) {
      return;
    }
    setIsButtonDisabled(true);

    const transport = await Transport.create();

    if (!transport) {
      setIsConnectSuccess(false);
      setIsConnectFailed(true);
      setIsButtonDisabled(false);
      return;
    }

    setIsConnectSuccess(true);
    await delay(1500);
    setCurrentStepIndex(1);

    try {
      const signedMessage = await handleLedgerMessageSigning({
        transport,
        addressIndex: selectedAccount.deviceAccountIndex,
        address: payload.address,
        networkType: network.type,
        message: payload.message,
        protocol: MessageSigningProtocols.BIP322,
      });

      await runesApi.submitCancelRunesSellOrder({
        orderIds: payload.orderIds,
        makerPublicKey: selectedAccount?.ordinalsPublicKey!,
        makerAddress: selectedAccount?.ordinalsAddress!,
        token: payload.token,
        signature: signedMessage.signature,
      });

      handleGoBack();
      toast(`${t('SIGNATURE_REQUEST.UNLISTED_SUCCESS')}`);
    } catch (e: any) {
      if (e.name === 'LockedDeviceError') {
        setCurrentStepIndex(0);
        setIsConnectSuccess(false);
        setIsConnectFailed(true);
      } else if (e.statusCode === 28160) {
        setIsConnectSuccess(false);
        setIsConnectFailed(true);
      } else if (e.cause === 27012) {
        setIsTxInvalid(true);
      } else {
        setIsTxRejected(true);
      }
    } finally {
      await transport.close();
      setIsButtonDisabled(false);
    }
  };

  const confirmSignMessage = async () => {
    const seedPhrase = await getSeed();
    return signMessage({
      accounts: accountsList,
      message: payload.message,
      address: payload.address,
      seedPhrase,
      network: network.type,
      protocol: MessageSigningProtocols.BIP322,
    });
  };

  const confirmCallback = async () => {
    if (!payload) return;
    try {
      setIsSigning(true);
      if (isHardwareAccount(selectedAccount)) {
        setIsModalVisible(true);
        return;
      }
      const signedMessage = await confirmSignMessage();

      await runesApi.submitCancelRunesSellOrder({
        orderIds: payload.orderIds,
        makerPublicKey: selectedAccount?.ordinalsPublicKey!,
        makerAddress: selectedAccount?.ordinalsAddress!,
        token: payload.token,
        signature: signedMessage.signature,
      });

      handleGoBack();
      toast(`${t('SIGNATURE_REQUEST.UNLISTED_SUCCESS')}`);
    } catch (err) {
      toast(`${t('SIGNATURE_REQUEST.UNLISTED_ERROR')}`);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <>
      <ConfirmScreen
        onConfirm={confirmCallback}
        onCancel={handleCancelClick}
        cancelText={t('SIGNATURE_REQUEST.CANCEL_BUTTON')}
        confirmText={t('SIGNATURE_REQUEST.SIGN_BUTTON')}
        loading={isSigning}
      >
        <TopRow onClick={handleGoBack} />
        <MainContainer>
          <RequestType>{t('SIGNATURE_REQUEST.TITLE')}</RequestType>
          <SignatureRequestMessage message={payload.message} />
          <CollapsableContainer
            text={bip0322Hash(payload.message)}
            title={t('SIGNATURE_REQUEST.MESSAGE_HASH_HEADER')}
          >
            <MessageHash>{bip0322Hash(payload.message)}</MessageHash>
          </CollapsableContainer>
          <SigningAddressContainer>
            <SigningAddressTitle>
              {t('SIGNATURE_REQUEST.SIGNING_ADDRESS_TITLE')}
            </SigningAddressTitle>
            <SigningAddress>
              {addressType && <SigningAddressType>{addressType}</SigningAddressType>}
              <SigningAddressValue data-testid="signing-address">
                {getTruncatedAddress(payload.address, 6)}
              </SigningAddressValue>
            </SigningAddress>
          </SigningAddressContainer>
          <ActionDisclaimer>{t('SIGNATURE_REQUEST.ACTION_DISCLAIMER')}</ActionDisclaimer>
          <InfoContainer bodyText={t('SIGNATURE_REQUEST.SIGNING_WARNING')} type="Info" />
        </MainContainer>
      </ConfirmScreen>
      <Sheet title="" visible={isModalVisible} onClose={() => setIsModalVisible(false)}>
        {currentStepIndex === 0 && (
          <LedgerConnectionView
            title={t('SIGNATURE_REQUEST.LEDGER.CONNECT.TITLE')}
            text={t('SIGNATURE_REQUEST.LEDGER.CONNECT.SUBTITLE', {
              name: 'Bitcoin',
            })}
            titleFailed={t('SIGNATURE_REQUEST.LEDGER.CONNECT.ERROR_TITLE')}
            textFailed={t('SIGNATURE_REQUEST.LEDGER.CONNECT.ERROR_SUBTITLE')}
            imageDefault={ledgerConnectBtcIcon}
            isConnectSuccess={isConnectSuccess}
            isConnectFailed={isConnectFailed}
          />
        )}
        {currentStepIndex === 1 && (
          <LedgerConnectionView
            title={t('SIGNATURE_REQUEST.LEDGER.CONFIRM.TITLE')}
            text={t('SIGNATURE_REQUEST.LEDGER.CONFIRM.SUBTITLE')}
            titleFailed={getConfirmationError('title')}
            textFailed={getConfirmationError('subtitle')}
            imageDefault={ledgerConnectDefaultIcon}
            isConnectSuccess={false}
            isConnectFailed={isTxRejected || isTxInvalid || isConnectFailed}
          />
        )}
        <SuccessActionsContainer>
          <Button
            onClick={
              isTxRejected || isTxInvalid || isConnectFailed ? handleRetry : handleConnectAndConfirm
            }
            title={t(
              isTxRejected || isTxInvalid || isConnectFailed
                ? 'SIGNATURE_REQUEST.LEDGER.RETRY_BUTTON'
                : 'SIGNATURE_REQUEST.LEDGER.CONNECT_BUTTON',
            )}
            disabled={isButtonDisabled}
            loading={isButtonDisabled}
            variant="primary"
          />
          <Button
            onClick={handleCancelClick}
            title={t('SIGNATURE_REQUEST.LEDGER.CANCEL_BUTTON')}
            variant="secondary"
          />
        </SuccessActionsContainer>
      </Sheet>
    </>
  );
}

export default SignMessageRequestInApp;
