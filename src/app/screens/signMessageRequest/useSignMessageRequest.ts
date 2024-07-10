import useSeedVault from '@hooks/useSeedVault';
import useSelectedAccount from '@hooks/useSelectedAccount';
import useWalletReducer from '@hooks/useWalletReducer';
import useWalletSelector from '@hooks/useWalletSelector';
import { Params, SignMessageOptions, SignMessagePayload } from '@sats-connect/core';
import { MessageSigningProtocols, signMessage } from '@secretkeylabs/xverse-core';
import { isHardwareAccount } from '@utils/helper';
import { decodeToken } from 'jsontokens';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import SuperJSON from 'superjson';

const useSignMessageRequestParams = () => {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const tabId = params.get('tabId') ?? '0';
  const requestId = params.get('requestId') ?? '';
  const payloadToken = params.get('payload') ?? '';

  const { payload, requestToken } = useMemo(() => {
    const token = params.get('signMessageRequest') ?? '';
    if (token) {
      const request = decodeToken(token) as any as SignMessageOptions;
      return {
        payload: request.payload,
        requestToken: token,
      };
    }
    const rpcPayload = SuperJSON.parse<Params<'signMessage'>>(payloadToken);

    return {
      payload: rpcPayload,
      requestToken: null,
    };
  }, [params, payloadToken]);

  return { tabId, payload, requestToken, requestId };
};

type ValidationError = {
  error: string;
  errorTitle?: string;
};

export const useSignMessageValidation = (
  requestPayload: SignMessagePayload | Params<'signMessage'> | undefined,
) => {
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const { t } = useTranslation('translation', { keyPrefix: 'REQUEST_ERRORS' });
  const selectedAccount = useSelectedAccount();
  const { accountsList, network } = useWalletSelector();
  const { switchAccount } = useWalletReducer();

  const checkAddressAvailability = () => {
    const account = accountsList.filter((acc) => {
      if (acc.btcAddress === requestPayload?.address) {
        return true;
      }
      if (acc.ordinalsAddress === requestPayload?.address) {
        return true;
      }
      return false;
    });
    return isHardwareAccount(selectedAccount) ? account[0] || selectedAccount : account[0];
  };

  const validateSignMessage = () => {
    if (!requestPayload) return;
    if ((requestPayload as any).network && (requestPayload as any).network.type !== network.type) {
      setValidationError({
        error: t('NETWORK_MISMATCH'),
      });
      return;
    }
    const account = checkAddressAvailability();
    if (account) {
      switchAccount(account);
    } else {
      setValidationError({
        error: t('ADDRESS_MISMATCH'),
      });
    }
  };

  useEffect(() => {
    if (requestPayload) {
      validateSignMessage();
    }
    return () => {
      setValidationError(null);
    };
  }, [requestPayload]);

  return { validationError, validateSignMessage };
};

export const useSignMessageRequest = () => {
  const { network, accountsList } = useWalletSelector();
  const { getSeed } = useSeedVault();
  const { payload, requestToken, tabId, requestId } = useSignMessageRequestParams();

  const confirmSignMessage = async () => {
    const { address, message } = payload;
    const seedPhrase = await getSeed();
    return signMessage({
      accounts: accountsList,
      message,
      address,
      protocol: (payload as any).protocol,
      seedPhrase,
      network: network.type,
    });
  };

  return {
    payload,
    requestToken,
    tabId,
    requestId,
    confirmSignMessage,
  };
};
