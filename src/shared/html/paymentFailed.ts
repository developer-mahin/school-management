export const paymentFailedHtml = () => `
    <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Failed</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: rgba(0, 0, 0, 1);
        }

        .container {
            text-align: center;
            background-color: rgba(255, 0, 0, 0.24);
            padding: 40px 30px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(255, 255, 255, 0.233);
            max-width: 400px;
            width: 100%;
        }

        h1 {
            font-size: 30px;
            color: #f44336;
            margin-bottom: 20px;
        }

        .icon {
            font-size: 60px;
            color: #f44336;
            margin-bottom: 20px;
        }

        p {
            font-size: 18px;
            color: #fff;
            margin-bottom: 20px;
        }

        .button {
            margin-top: 20px;
            padding: 12px 30px;
            background-color: #f44336;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }

        .button:hover {
            background-color: #d32f2f;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="icon">
            &#10060;
        </div>
        <h1>Payment Failed!</h1>
        <p>Unfortunately, your payment could not be processed. Please try again or contact support.</p>
        
    </div>
</body>

</html>
`;
