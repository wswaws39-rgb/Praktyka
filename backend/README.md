Backend



Przeznaczenie



Backend jest częścią aplikacji działającą na serwerze. Odbiera zapytania z frontendu, sprawdza przesłane dane i wykonuje operacje na zadaniach. Następnie odsyła wynik do interfejsu użytkownika.



Komunikacja z frontendem



Frontend będzie komunikował się z backendem przez API za pomocą zapytań HTTP. Planujemy przesyłać dane w formacie JSON.



Przykładowo, po wypełnieniu formularza dodawania zadania frontend wyśle dane do backendu. Backend sprawdzi, czy tytuł nie jest pusty, zapisze zadanie i zwróci informację o wyniku operacji.



Baza danych



Dane będą przechowywane w bazie PostgreSQL. Backend będzie odpowiadał za odczytywanie, dodawanie, aktualizowanie i usuwanie rekordów.



Frontend nie będzie łączył się bezpośrednio z bazą danych. Wszystkie operacje będą wykonywane przez backend.



Planujemy, aby zadanie zawierało:



identyfikator;



tytuł;



opis;



status.



Planowane endpointy API



Endpoint to adres w API, pod który frontend wysyła zapytanie.



Metoda



Adres



Działanie



GET



/api/tasks



Pobranie listy zadań



POST



/api/tasks



Dodanie nowego zadania



PUT



/api/tasks/{id}



Aktualizacja wybranego zadania



DELETE



/api/tasks/{id}



Usunięcie wybranego zadania



{id} oznacza identyfikator zadania, którego dotyczy operacja.



Proponowana struktura projektu



Controllers/ — odbieranie zapytań HTTP i zwracanie odpowiedzi.



Models/ — opis struktury danych, na przykład modelu zadania.



Services/ — logika aplikacji i reguły obsługi zadań.



Data/ — komunikacja z bazą danych.



Tests/ — testy części serwerowej.



README.md — dokumentacja backendu.



Technologie i etap prac



Planowana baza danych to PostgreSQL. Język programowania i technologia backendu wymagają jeszcze ustalenia.



Opisane API i struktura katalogów są planem dalszych prac. Instrukcja uruchomienia zostanie dodana po przygotowaniu backendu.

