import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalItemValue,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  formattedValue: string;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      await api
        .get(`/foods/${routeParams.id}`)
        .then(({ data: selectedFood }) => {
          setFood({
            ...selectedFood,
            formattedPrice: formatValue(selectedFood.price),
          });

          setExtras(
            selectedFood.extras.map(
              (extra: Extra): Extra =>
                ({
                  ...extra,
                  formattedValue: formatValue(extra.value),
                  quantity: 0,
                } as Extra),
            ),
          );
        });
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    async function loadFavorites(): Promise<void> {
      await api.get(`/favorites/${routeParams.id}`).then(() => {
        setIsFavorite(true);
      });
    }

    loadFavorites();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    setExtras(
      extras.map(extra => {
        if (extra.id !== id) return extra;
        return {
          ...extra,
          quantity: extra.quantity + 1,
        };
      }),
    );
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    setExtras(
      extras.map(extra => {
        if (extra.id !== id) return extra;

        return {
          ...extra,
          quantity: extra.quantity === 0 ? 0 : extra.quantity - 1,
        };
      }),
    );
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    setFoodQuantity(foodQuantity === 1 ? 1 : foodQuantity - 1);
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    if (!isFavorite) {
      delete food.extras;

      await api.post('/favorites', food).then(() => {
        setIsFavorite(true);
      });
    } else {
      await api.delete(`/favorites/${food.id}`).then(() => {
        setIsFavorite(false);
      });
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const totalCart = extras.reduce((previousValue, extra) => {
      const subtotal = extra.quantity * extra.value;
      return previousValue + subtotal;
    }, 0);

    return formatValue(totalCart + food.price * foodQuantity);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const newOrder = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      thumbnail_url: food.thumbnail_url,
      extras,
    };
    await api.post('/orders', newOrder);
    navigation.goBack();
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalItemValue>{extra.formattedValue}</AdittionalItemValue>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
