import {NextRequest, NextResponse} from "next/server";
import {supabase} from "@/lib/supabase/ClientComponentClient";

export const GET = async (req: NextRequest) => {
  try {
    const response = [
      {
        "id": 1,
        "title": "Паста Карбонара",
        "desc": "Классическая итальянская паста с беконом, желтками и пармезаном.",
        "images": [
          "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg",
          "https://images.pexels.com/photos/590822/pexels-photo-590822.jpeg",
          "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg"
        ],
        "category": 'Main dishes',
        "likes": 10,
      },
      {
        "id": 2,
        "title": "Суши Филадельфия",
        "desc": "Роллы с лососем, сливочным сыром и огурцом.",
        "images": [
          "https://images.pexels.com/photos/2098143/pexels-photo-2098143.jpeg",
          "https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg",
          "https://images.pexels.com/photos/3296399/pexels-photo-3296399.jpeg"
        ],
        "category": 'Main dishes',
        "likes": 1,
      },
      {
        "id": 3,
        "title": "Пицца Маргарита",
        "desc": "Итальянская пицца с томатами, моцареллой и базиликом.",
        "images": [
          "https://images.unsplash.com/photo-1601924582975-7e1bd56b37e9",
          "https://images.unsplash.com/photo-1542281286-9e0a16bb7366",
          "https://images.unsplash.com/photo-1555992336-cbfdb0c4d2aa"
        ],
        "category": 'Main dishes',
        "likes": 15,
      },
      {
        "id": 4,
        "title": "Борщ украинский",
        "desc": "Свекольный суп с говядиной, чесноком и зеленью.",
        "images": [
          "https://images.pexels.com/photos/5949890/pexels-photo-5949890.jpeg",
          "https://images.pexels.com/photos/7732539/pexels-photo-7732539.jpeg"
        ],
        "category": 'Soups',
        "likes": 1,
      },
      {
        "id": 5,
        "title": "Бургер классический",
        "desc": "Сочный бургер с говядиной, сыром и свежими овощами.",
        "images": [
          "https://images.pexels.com/photos/1639569/pexels-photo-1639569.jpeg",
          "https://images.pexels.com/photos/1615195/pexels-photo-1615195.jpeg",
          "https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg"
        ],
        "category": 'Main dishes',
        "likes": 1,
      },
      {
        "id": 6,
        "title": "Шакшука",
        "desc": "Яйца, тушённые в томатном соусе с перцем и специями.",
        "images": [
          "https://images.pexels.com/photos/12737993/pexels-photo-12737993.jpeg",
          "https://images.pexels.com/photos/13363383/pexels-photo-13363383.jpeg"
        ],
        "category": 'Appetizers',
        "likes": 1,
      },
      {
        "id": 7,
        "title": "Плов узбекский",
        "desc": "Рассыпчатый плов с морковью, луком и бараниной.",
        "images": [
          "https://images.pexels.com/photos/6405817/pexels-photo-6405817.jpeg",
          "https://images.pexels.com/photos/5591713/pexels-photo-5591713.jpeg"
        ],
        "category": 'Main dishes',
        "likes": 1,
      },
      {
        "id": 8,
        "title": "Омлет с овощами",
        "desc": "Лёгкий омлет с овощами и зеленью.",
        "images": [
          "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg",
          "https://images.pexels.com/photos/1437263/pexels-photo-1437263.jpeg"
        ],
        "category": 'Side dishes',
        "likes": 1,
      },
      {
        "id": 9,
        "title": "Брауни",
        "desc": "Шоколадный десерт с плотной текстурой и насыщенным вкусом.",
        "images": [
          "https://images.pexels.com/photos/45202/brownie-chocolate-dessert-sweet-45202.jpeg",
          "https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg"
        ],
        "category": 'Deserts',
        "likes": 1,
      },
      {
        "id": 10,
        "title": "Салат Цезарь",
        "desc": "Хрустящий салат с курицей, сыром и соусом Цезарь.",
        "images": [
          "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
          "https://images.pexels.com/photos/590835/pexels-photo-590835.jpeg",
          "https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg"
        ],
        "category": 'Salads',
        "likes": 1,
      }
    ]

    return NextResponse.json(response);
  } catch (error) {
    console.log(error);
  }
}

export const POST = async (req: NextRequest) => {

  const { data, error } = await supabase
    .from('recipes')
    .insert([req.body]);
  console.log(req.body);
}