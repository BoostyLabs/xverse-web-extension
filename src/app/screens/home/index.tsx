/* eslint-disable no-await-in-loop */
import SIP10Icon from '@assets/img/dashboard/SIP10.svg';
import ArrowDownLeft from '@assets/img/dashboard/arrow_down_left.svg';
import ArrowUpRight from '@assets/img/dashboard/arrow_up_right.svg';
import IconBitcoin from '@assets/img/dashboard/bitcoin_icon.svg';
import BitcoinToken from '@assets/img/dashboard/bitcoin_token.svg';
import CreditCard from '@assets/img/dashboard/credit_card.svg';
import ListDashes from '@assets/img/dashboard/list_dashes.svg';
import OrdinalsIcon from '@assets/img/dashboard/ordinalBRC20.svg';
import IconStacks from '@assets/img/dashboard/stack_icon.svg';
import AccountHeaderComponent from '@components/accountHeader';
import BottomModal from '@components/bottomModal';
import ReceiveCardComponent from '@components/receiveCardComponent';
import SmallActionButton from '@components/smallActionButton';
import BottomBar from '@components/tabBar';
import TokenTile from '@components/tokenTile';
import useAppConfig from '@hooks/queries/useAppConfig';
import useBtcCoinBalance from '@hooks/queries/useBtcCoinsBalance';
import useBtcWalletData from '@hooks/queries/useBtcWalletData';
import useCoinsData from '@hooks/queries/useCoinData';
import useCoinRates from '@hooks/queries/useCoinRates';
import useFeeMultipliers from '@hooks/queries/useFeeMultipliers';
import useStxWalletData from '@hooks/queries/useStxWalletData';
import useWalletSelector from '@hooks/useWalletSelector';
import CoinSelectModal from '@screens/home/coinSelectModal';
import { FungibleToken } from '@secretkeylabs/xverse-core/types';
import { CurrencyTypes } from '@utils/constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Theme from 'theme';
import AlertMessage from '@components/alertMessage';
import { useDispatch } from 'react-redux';
import { ChangeShowBtcReceiveAlertAction, ChangeShowOrdinalReceiveAlertAction } from '@stores/wallet/actions/actionCreators';
import BalanceCard from './balanceCard';
import ShowBtcReceiveAlert from '@components/showBtcReceiveAlert';
import ShowOrdinalReceiveAlert from '@components/showOrdinalReceiveAlert';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 16px;
  margin-right: 16px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ColumnContainer = styled.div((props) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'space-between',
  justifyContent: 'space-between',
  marginTop: props.theme.spacing(12),
}));

const ReceiveContainer = styled.div((props) => ({
  display: 'flex',
  flexDirection: 'column',
  marginTop: props.theme.spacing(12),
  marginBottom: props.theme.spacing(16),
  paddingLeft: props.theme.spacing(8),
  paddingRight: props.theme.spacing(8),
}));

const CoinContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'space-between',
  justifyContent: 'space-between',
});

const Button = styled.button((props) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-end',
  alignItems: 'center',
  borderRadius: props.theme.radius(1),
  backgroundColor: 'transparent',
  opacity: 0.8,
  marginTop: props.theme.spacing(5),
}));

const ButtonText = styled.div((props) => ({
  ...props.theme.body_xs,
  fontWeight: 700,
  color: props.theme.colors.white['0'],
  textAlign: 'center',
}));

const ButtonImage = styled.img((props) => ({
  marginRight: props.theme.spacing(3),
  alignSelf: 'center',
  transform: 'all',
}));

const RowButtonContainer = styled.div((props) => ({
  display: 'flex',
  flexDirection: 'row',
  marginTop: props.theme.spacing(11),
}));

const ButtonContainer = styled.div((props) => ({
  marginRight: props.theme.spacing(11),
}));

const TokenListButtonContainer = styled.div((props) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: props.theme.spacing(6),
  marginBottom: props.theme.spacing(22),
}));

const Icon = styled.img({
  width: 24,
  height: 24,
});

const MergedIcon = styled.img({
  width: 40,
  height: 40,
});

function Home() {
  const { t } = useTranslation('translation', {
    keyPrefix: 'DASHBOARD_SCREEN',
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openReceiveModal, setOpenReceiveModal] = useState(false);
  const [openSendModal, setOpenSendModal] = useState(false);
  const [openBuyModal, setOpenBuyModal] = useState(false);
  const [isBtcReceiveAlertVisible, setIsBtcReceiveAlertVisible] = useState(false);
  const [isOrdinalReceiveAlertVisible, setIsOrdinalReceiveAlertVisible] = useState(false);
  const { coinsList, stxAddress, btcAddress, ordinalsAddress, brcCoinsList, showBtcReceiveAlert, showOrdinalReceiveAlert } = useWalletSelector();
  const { isLoading: loadingStxWalletData, isRefetching: refetchingStxWalletData } =
    useStxWalletData();
  const { isLoading: loadingBtcWalletData, isRefetching: refetchingBtcWalletData } =
    useBtcWalletData();
  const { isLoading: loadingCoinData, isRefetching: refetchingCoinData } = useCoinsData();
  const { isLoading: loadingBtcCoinData, isRefetching: refetchingBtcCoinData } =
    useBtcCoinBalance();
  useFeeMultipliers();
  useCoinRates();
  useAppConfig();

  const onReceiveModalOpen = () => {
    setOpenReceiveModal(true);
  };

  const onReceiveModalClose = () => {
    setOpenReceiveModal(false);
  };

  const onSendModalOpen = () => {
    setOpenSendModal(true);
  };

  const onSendModalClose = () => {
    setOpenSendModal(false);
  };

  const onBuyModalOpen = () => {
    setOpenBuyModal(true);
  };

  const onBuyModalClose = () => {
    setOpenBuyModal(false);
  };

  function getCoinsList() {
    const list = coinsList ? coinsList?.filter((ft) => ft.visible) : [];
    return brcCoinsList ? list.concat(brcCoinsList) : list;
  }

  const handleManageTokenListOnClick = () => {
    navigate('/manage-tokens');
  };

  const onStxSendClick = () => {
    navigate('/send-stx');
  };

  const onBtcSendClick = () => {
    navigate('/send-btc');
  };

  const onBTCReceiveSelect = () => {
    navigate('/receive/BTC');
  };

  const onSTXReceiveSelect = () => {
    navigate('/receive/STX');
  };

  const onSendFtSelect = (coin: FungibleToken) => {
    if (coin.protocol === 'brc-20') {
      navigate('send-brc20', {
        state: {
          fungibleToken: coin,
        },
      });
      return;
    }
    navigate('send-ft', {
      state: {
        fungibleToken: coin,
      },
    });
  };

  const onBuyStxClick = () => {
    navigate('/buy/STX');
  };

  const onBuyBtcClick = () => {
    navigate('/buy/BTC');
  };

  const onOrdinalReceiveAlertOpen = () => {
    if (showOrdinalReceiveAlert)
    setIsOrdinalReceiveAlertVisible(true);
  };

  const onOrdinalReceiveAlertClose = () => {
    setIsOrdinalReceiveAlertVisible(false);
  };

  const onReceiveAlertClose = () => {
    setIsBtcReceiveAlertVisible(false);
  };

  const onReceiveAlertOpen = () => {
    if (showBtcReceiveAlert)
    setIsBtcReceiveAlertVisible(true);
  };

  const handleTokenPressed = (token: {
    coin: CurrencyTypes;
    ft: string | undefined;
    brc20Ft?: string;
  }) => {
    if (token.brc20Ft) {
      navigate(`/coinDashboard/${token.coin}?brc20ft=${token.brc20Ft}`);
    } else {
      navigate(`/coinDashboard/${token.coin}?ft=${token.ft}`);
    }
  };

  const onOrdinalsReceivePress = () => {
    navigate('/receive/ORD');
  };

  const receiveContent = (
    <ReceiveContainer>
      <ReceiveCardComponent
        title={t('BITCOIN')}
        address={btcAddress}
        onQrAddressClick={onBTCReceiveSelect}
        onCopyAddressClick={onReceiveAlertOpen}
      >
        <Icon src={BitcoinToken} />
      </ReceiveCardComponent>

      <ReceiveCardComponent
        title={t('ORDINALS')}
        address={ordinalsAddress}
        onQrAddressClick={onOrdinalsReceivePress}
        onCopyAddressClick={onOrdinalReceiveAlertOpen}
      >
        <MergedIcon src={OrdinalsIcon} />
      </ReceiveCardComponent>

      <ReceiveCardComponent
        title={t('STACKS_AND_TOKEN')}
        address={stxAddress}
        onQrAddressClick={onSTXReceiveSelect}
      >
        <MergedIcon src={SIP10Icon} />
      </ReceiveCardComponent>
    </ReceiveContainer>
  );
  return (
    <>
      <AccountHeaderComponent />
      {isBtcReceiveAlertVisible && <ShowBtcReceiveAlert onReceiveAlertClose={onReceiveAlertClose}/>}
      {isOrdinalReceiveAlertVisible && <ShowOrdinalReceiveAlert onOrdinalReceiveAlertClose={onOrdinalReceiveAlertClose}/>}
      <Container>
        <BalanceCard
          isLoading={
            loadingStxWalletData ||
            loadingBtcWalletData ||
            refetchingStxWalletData ||
            refetchingBtcWalletData
          }
        />
        <RowButtonContainer>
          <ButtonContainer>
            <SmallActionButton src={ArrowUpRight} text={t('SEND')} onPress={onSendModalOpen} />
          </ButtonContainer>
          <ButtonContainer>
            <SmallActionButton
              src={ArrowDownLeft}
              text={t('RECEIVE')}
              onPress={onReceiveModalOpen}
            />
          </ButtonContainer>
          <ButtonContainer>
            <SmallActionButton src={CreditCard} text={t('BUY')} onPress={onBuyModalOpen} />
          </ButtonContainer>
        </RowButtonContainer>

        <ColumnContainer>
          <TokenTile
            title={t('BITCOIN')}
            currency="BTC"
            icon={IconBitcoin}
            loading={loadingBtcWalletData || refetchingBtcWalletData}
            underlayColor={Theme.colors.background.elevation1}
            onPress={handleTokenPressed}
          />
          <TokenTile
            title={t('STACKS')}
            currency="STX"
            icon={IconStacks}
            loading={loadingStxWalletData || refetchingStxWalletData}
            underlayColor={Theme.colors.background.elevation1}
            onPress={handleTokenPressed}
          />
        </ColumnContainer>

        <CoinContainer>
          {coinsList
            ?.filter((ft) => ft.visible)
            .map((coin) => (
              <TokenTile
                title={coin.name}
                currency="FT"
                loading={loadingCoinData || refetchingCoinData}
                underlayColor={Theme.colors.background.elevation1}
                fungibleToken={coin}
                onPress={handleTokenPressed}
              />
            ))}
          {brcCoinsList?.map((coin) => (
            <TokenTile
              title={coin.name}
              currency="brc20"
              loading={loadingBtcCoinData || refetchingBtcCoinData}
              underlayColor={Theme.colors.background.elevation1}
              fungibleToken={coin}
              onPress={handleTokenPressed}
            />
          ))}
        </CoinContainer>
        <BottomModal visible={openReceiveModal} header={t('RECEIVE')} onClose={onReceiveModalClose}>
          {receiveContent}
        </BottomModal>

        <TokenListButtonContainer>
          <Button onClick={handleManageTokenListOnClick}>
            <>
              <ButtonImage src={ListDashes} />
              <ButtonText>{t('MANAGE_TOKEN')}</ButtonText>
            </>
          </Button>
        </TokenListButtonContainer>
        <CoinSelectModal
          onSelectBitcoin={onBtcSendClick}
          onSelectStacks={onStxSendClick}
          onClose={onSendModalClose}
          onSelectCoin={onSendFtSelect}
          visible={openSendModal}
          coins={getCoinsList()}
          title={t('SEND')}
          loadingWalletData={loadingStxWalletData || loadingBtcWalletData}
        />

        <CoinSelectModal
          onSelectBitcoin={onBuyBtcClick}
          onSelectStacks={onBuyStxClick}
          onClose={onBuyModalClose}
          onSelectCoin={onBuyModalClose}
          visible={openBuyModal}
          coins={[]}
          title={t('BUY')}
          loadingWalletData={loadingStxWalletData || loadingBtcWalletData}
        />
      </Container>
      <BottomBar tab="dashboard" />
    </>
  );
}

export default Home;
