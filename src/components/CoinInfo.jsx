import axios from "axios";
import React, { useEffect, useState } from "react";
import { HistoricalChart } from "../config/api";
import { Line } from "react-chartjs-2";

import {
  CircularProgress,
  createTheme,
  makeStyles,
  ThemeProvider,
  Typography,
  Button,
  Modal,
  Box,
  TextField,
} from "@material-ui/core";
import SelectButton from "./SelectButton";
import { chartDays } from "../config/data";
import { CryptoState } from "../CryptoContext";

const CoinInfo = ({ coin }) => {
  const [historicData, setHistoricData] = useState(null);
  const [days, setDays] = useState(1);
  const [flag, setFlag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [predictionDate, setPredictionDate] = useState("");
  const [predictionResult, setPredictionResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // @ts-ignore
  const { currency, setAlert } = CryptoState();

  const useStyles = makeStyles((theme) => ({
    container: {
      width: "75%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 25,
      padding: 40,
      [theme.breakpoints.down("md")]: {
        width: "100%",
        marginTop: 0,
        padding: 20,
        paddingTop: 0,
      },
    },
    predictionButton: {
      width: "100%",
      marginTop: 20,
    },
    modalStyle: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 400,
      backgroundColor: "#1e1e1e",
      border: "2px solid #000",
      boxShadow: 24,
      padding: 20,
      borderRadius: 8,
      color: "white",
    },
  }));

  const classes = useStyles();

  const fetchHistoricData = async () => {
    const { data } = await axios.get(HistoricalChart(coin.id, days, currency));
    setFlag(true);
    setHistoricData(data.prices);
  };

  useEffect(() => {
    fetchHistoricData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const darkTheme = createTheme({
    palette: {
      primary: {
        main: "#fff",
      },
      type: "dark",
    },
  });

  const handlePredict = async () => {
    setLoading(true);
    const currentDate = new Date().toISOString().split("T")[0];
    const asset = `${coin?.symbol.toUpperCase()}-USD`;

    console.log(asset, currentDate, predictionDate);
    try {
      const response = await axios.get(
        `http://localhost:5000/predict_price?asset=${asset}&end=${currentDate}&predict=${predictionDate}`
      );
      setPredictionResult(response.data.predicted_price);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      setAlert({
        open: true,
        message: "Error fetching prediction.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPredictionDate("");
    setPredictionResult(null);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div className={classes.container}>
        {!historicData || flag === false ? (
          <CircularProgress
            style={{ color: "gold" }}
            size={250}
            thickness={1}
          />
        ) : (
          <>
            <Line
              options={{
                elements: {
                  point: {
                    radius: 1,
                  },
                },
              }}
              data={{
                labels: historicData.map((coin) => {
                  let date = new Date(coin[0]);
                  let time =
                    date.getHours() > 12
                      ? `${date.getHours() - 12}:${date.getMinutes()} PM`
                      : `${date.getHours()}:${date.getMinutes()} AM`;
                  return days === 1 ? time : date.toLocaleDateString();
                }),

                datasets: [
                  {
                    data: historicData.map((coin) => coin[1]),
                    label: `Price ( Past ${days} Days ) in ${currency}`,
                    borderColor: "#EEBC1D",
                  },
                ],
              }}
            />
            <div
              style={{
                display: "flex",
                marginTop: 20,
                justifyContent: "space-around",
                width: "100%",
              }}
            >
              {chartDays.map((day) => (
                <SelectButton
                  key={day.value}
                  onClick={() => {
                    setDays(day.value);
                    setFlag(false);
                  }}
                  selected={day.value === days}
                >
                  {day.label}
                </SelectButton>
              ))}
            </div>

            <Button
              variant="contained"
              color="black"
              onClick={handleOpenModal}
              className={classes.predictionButton}
              style={{
                backgroundColor: "gold",
                color: "black",
                fontWeight: 700,
              }}
            >
              Predict
            </Button>

            <Modal open={modalOpen} onClose={handleCloseModal}>
              <Box className={classes.modalStyle}>
                <Typography variant="h6" style={{ marginBottom: "15px" }}>
                  Select a Date for Prediction
                </Typography>
                <TextField
                  label="Prediction Date (YYYY-MM-DD)"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={predictionDate}
                  onChange={(e) => setPredictionDate(e.target.value)}
                  error={
                    predictionDate &&
                    !/^\d{4}-\d{2}-\d{2}$/.test(predictionDate)
                  } // Highlight red if pattern doesn't match
                  helperText={
                    predictionDate &&
                    !/^\d{4}-\d{2}-\d{2}$/.test(predictionDate)
                      ? "Date must match the format YYYY-MM-DD"
                      : ""
                  }
                />
                <Button
                  variant="contained"
                  color="black"
                  onClick={handlePredict}
                  className={classes.predictionButton}
                  disabled={
                    loading ||
                    !predictionDate || // Disable if no date is provided
                    !/^\d{4}-\d{2}-\d{2}$/.test(predictionDate) // Disable if pattern doesn't match
                  }
                >
                  {loading ? (
                    <CircularProgress
                      style={{ color: "gold" }}
                      size={25}
                      thickness={5}
                    />
                  ) : (
                    "Get Prediction"
                  )}
                </Button>

                {predictionResult && (
                  <Box
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 30,
                    }}
                  >
                    <Typography
                      variant="h6"
                      style={{
                        color: "gold",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Predicted Price
                    </Typography>
                    <Typography
                      variant="h5"
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        textAlign: "center",
                        marginTop: 10,
                      }}
                    >
                      {currency === "INR"
                        ? `${(predictionResult * 84.5).toFixed(2)}`
                        : `${predictionResult.toFixed(2)}`}{" "}
                      {currency}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Modal>
          </>
        )}
      </div>
    </ThemeProvider>
  );
};

export default CoinInfo;
