import BottomBar from '@components/tabBar';
import TopRow from '@components/topRow';
import { useGetBrc20FungibleTokens } from '@hooks/queries/ordinals/useGetBrc20FungibleTokens';
import { useGetSip10FungibleTokens } from '@hooks/queries/stx/useGetSip10FungibleTokens';
import useCoinRates from '@hooks/queries/useCoinRates';
import useWalletSelector from '@hooks/useWalletSelector';
import { SupportedCurrency } from '@secretkeylabs/xverse-core';
import { ChangeFiatCurrencyAction } from '@stores/wallet/actions/actionCreators';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { currencyList } from '../../../utils/currency';
import CurrencyRow from './currencyRow';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: ${(props) => props.theme.space.m};
  padding-top: 0;
  &::-webkit-scrollbar {
    display: none;
  }
`;

function FiatCurrencyScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'SETTING_SCREEN' });
  const { fiatCurrency } = useWalletSelector();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // here to fetch new rates on currency change, to avoid glitches in home balance card and tokens fiat value
  useCoinRates();
  useGetSip10FungibleTokens();
  useGetBrc20FungibleTokens();

  const handleBackButtonClick = () => {
    navigate('/settings');
  };

  const onClick = (currency: SupportedCurrency) => {
    dispatch(ChangeFiatCurrencyAction(currency));
  };

  function showDivider(index: number): boolean {
    return !(index === currencyList.length - 1);
  }

  return (
    <>
      <TopRow title={t('CURRENCY')} onClick={handleBackButtonClick} />
      <Container>
        {currencyList.map((coin, index) => (
          <CurrencyRow
            currency={coin}
            isSelected={coin.name === fiatCurrency}
            onCurrencySelected={onClick}
            key={coin.name.toString()}
            showDivider={showDivider(index)}
          />
        ))}
      </Container>
      <BottomBar tab="settings" />
    </>
  );
}

export default FiatCurrencyScreen;
