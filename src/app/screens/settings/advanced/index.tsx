import useChromeLocalStorage from '@hooks/useChromeLocalStorage';
import useSelectedAccount from '@hooks/useSelectedAccount';
import useWalletSelector from '@hooks/useWalletSelector';
import {
  ChangeActivateOrdinalsAction,
  ChangeActivateRareSatsAction,
  ChangeActivateRBFAction,
} from '@stores/wallet/actions/actionCreators';
import { chromeLocalStorageKeys } from '@utils/chromeLocalStorage';
import { isInOptions, isLedgerAccount } from '@utils/helper';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import SettingComponent from '../settingComponent';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0 ${(props) => props.theme.space.xs};
  ${(props) => props.theme.scrollbar}
`;

function AdvancedSettings() {
  const { t } = useTranslation('translation', { keyPrefix: 'SETTING_SCREEN' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hasActivatedOrdinalsKey, hasActivatedRareSatsKey, hasActivatedRBFKey } =
    useWalletSelector();
  const selectedAccount = useSelectedAccount();
  const [isPriorityWallet, setIsPriorityWallet] = useChromeLocalStorage<boolean>(
    chromeLocalStorageKeys.isPriorityWallet,
    true,
  );

  const switchIsPriorityWallet = () => {
    setIsPriorityWallet(!isPriorityWallet);
  };

  const switchActivateOrdinalState = () => {
    dispatch(ChangeActivateOrdinalsAction(!hasActivatedOrdinalsKey));
    // disable rare sats if ordinal is disabled
    dispatch(ChangeActivateRareSatsAction(false));
  };

  const switchActivateRareSatsState = () => {
    dispatch(ChangeActivateRareSatsAction(!hasActivatedRareSatsKey));
  };

  const switchActivateRBFState = () => {
    dispatch(ChangeActivateRBFAction(!hasActivatedRBFKey));
  };

  const onRestoreFundClick = async () => {
    if (isLedgerAccount(selectedAccount) && !isInOptions()) {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('options.html#/restore-funds'),
      });
      return;
    }

    navigate('/restore-funds');
  };

  return (
    <Container>
      <SettingComponent
        title={t('ADVANCED')}
        text={t('ACTIVATE_ORDINAL_NFTS')}
        toggle
        toggleFunction={switchActivateOrdinalState}
        toggleValue={hasActivatedOrdinalsKey}
        showDivider
      />
      <SettingComponent
        text={t('ENABLE_RARE_SATS')}
        description={t('ENABLE_RARE_SATS_DETAIL')}
        toggle
        toggleFunction={switchActivateRareSatsState}
        toggleValue={hasActivatedRareSatsKey}
        disabled={!hasActivatedOrdinalsKey}
        showDivider
      />
      <SettingComponent
        text={t('XVERSE_DEFAULT')}
        description={t('XVERSE_DEFAULT_DESCRIPTION')}
        toggle
        toggleFunction={switchIsPriorityWallet}
        toggleValue={isPriorityWallet}
        showDivider
      />
      <SettingComponent
        text={t('ENABLE_SPEED_UP_TRANSACTIONS')}
        description={t('ENABLE_SPEED_UP_TRANSACTIONS_DETAIL')}
        toggle
        toggleFunction={switchActivateRBFState}
        toggleValue={hasActivatedRBFKey}
        showDivider
      />
      <SettingComponent
        text={t('RECOVER_ASSETS')}
        onClick={onRestoreFundClick}
        // icon={ArrowIcon}
      />
    </Container>
  );
}

export default AdvancedSettings;
