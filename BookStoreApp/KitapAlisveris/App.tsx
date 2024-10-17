import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import axios from 'axios';

const API_KEY = '0sEIlbVpEbK7txXmhBAB8DaNRNPdP3j8'; 
const BOOKS_URL = `https://api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json?api-key=${API_KEY}`;

const App = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0); // İndirim toplamı için durum

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(BOOKS_URL);
        const updatedBooks = response.data.results.books.map((book) => {
          const price = (Math.random() * (30 - 10) + 10).toFixed(2); // 10 ile 30 arasında rastgele fiyat
          const discount = Math.random() > 0.5 ? 0.1 : 0; // %10 indirim (rastgele olarak uygulanabilir)
          return {
            ...book,
            price: price,
            discount: discount,
            discountedPrice: (price * (1 - discount)).toFixed(2), // İndirimli fiyat
            quantity: 0, // Başlangıçta miktar 0
          };
        });
        setBooks(updatedBooks);
        setLoading(false);
      } catch (error) {
        console.error("Hata:", error.response ? error.response.data : error.message);
        Alert.alert("Hata", "Kitapları yüklerken bir hata oluştu. Lütfen tekrar deneyin.");
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const addToCart = (book) => {
    if (book.quantity === 0) {
      Alert.alert("Hata", "Sepete eklemek için öncelikle miktarı artırmalısınız.");
      return;
    }
    setCart((prevCart) => {
      const existingBook = prevCart.find((item) => item.primary_isbn10 === book.primary_isbn10);
      if (existingBook) {
        return prevCart.map((item) =>
          item.primary_isbn10 === book.primary_isbn10
            ? { ...item, quantity: item.quantity + book.quantity } // Miktar ekleniyor
            : item
        );
      } else {
        return [...prevCart, { ...book, quantity: book.quantity }];
      }
    });
  };

  const updateQuantity = (book, delta) => {
    setBooks((prevBooks) =>
      prevBooks.map((item) =>
        item.primary_isbn10 === book.primary_isbn10
          ? { ...item, quantity: Math.max(item.quantity + delta, 0) } // Miktar 0'dan düşük olamaz
          : item
      )
    );
  };

  const removeFromCart = (book) => {
    setCart((prevCart) => {
      const existingBook = prevCart.find((item) => item.primary_isbn10 === book.primary_isbn10);
      if (existingBook) {
        if (existingBook.quantity > 1) {
          return prevCart.map((item) =>
            item.primary_isbn10 === book.primary_isbn10
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        } else {
          return prevCart.filter((item) => item.primary_isbn10 !== book.primary_isbn10);
        }
      }
      return prevCart;
    });
  };

  useEffect(() => {
    const newTotal = cart.reduce((acc, book) => acc + (book.discountedPrice * book.quantity), 0);
    const newTotalDiscount = cart.reduce((acc, book) => acc + (book.price * book.quantity) - (book.discountedPrice * book.quantity), 0); // Toplam indirim
    setTotal(newTotal);
    setTotalDiscount(newTotalDiscount.toFixed(2)); // İndirimli toplam
  }, [cart]);

  const toggleDiscount = (book) => {
    setBooks((prevBooks) =>
      prevBooks.map((item) =>
        item.primary_isbn10 === book.primary_isbn10
          ? { ...item, discount: item.discount === 0 ? 0.1 : 0, discountedPrice: (item.price * (1 - (item.discount === 0 ? 0.1 : 0))).toFixed(2) } // İndirim durumunu değiştir
          : item
      )
    );
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.bookContainer}>
        <Image source={{ uri: item.book_image }} style={styles.bookImage} />
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <Text style={styles.bookPrice}>Fiyat: ${item.price} (İndirimli: ${item.discountedPrice})</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => updateQuantity(item, -1)} disabled={item.quantity === 0}>
            <Text style={styles.quantityButton}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item, 1)}>
            <Text style={styles.quantityButton}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => addToCart(item)}>
          <Text style={styles.buttonText}>Sepete Ekle</Text>
        </TouchableOpacity>
        <View style={styles.discountContainer}>
          <Text>İndirim Uygula:</Text>
          <Switch 
            value={item.discount > 0} // İndirim var mı kontrolü
            onValueChange={() => toggleDiscount(item)} 
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Kitap Alışveriş Sitesi</Text>
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={(item) => item.primary_isbn10}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
      <View style={styles.cartContainer}>
        <Text style={styles.cartHeader}>Sepet Toplamı: ${total.toFixed(2)}</Text>
        <Text style={styles.cartDiscountHeader}>İndirim Toplamı: ${totalDiscount}</Text>
        {cart.length === 0 && <Text style={styles.cartEmpty}>Sepetiniz boş.</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  bookContainer: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    padding: 10,
    marginBottom: 20,
  },
  bookImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  bookTitle: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  bookAuthor: {
    color: '#666',
  },
  bookPrice: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  quantityButton: {
    backgroundColor: '#007BFF',
    color: '#fff',
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 8,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
  cartContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  cartHeader: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cartDiscountHeader: {
    fontSize: 18,
    color: 'red', // İndirim toplamının rengini kırmızı yap
    fontWeight: 'bold',
  },
  cartEmpty: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 8,
  },
});

export default App;
