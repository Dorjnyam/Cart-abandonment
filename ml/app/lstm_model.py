import logging
from pathlib import Path

import torch
from torch import nn

from app.config import settings

logger = logging.getLogger(__name__)


class LSTMClassifier(nn.Module):
    def __init__(self, input_size: int = 1, hidden_size: int = 32) -> None:
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            batch_first=True,
        )
        self.head = nn.Linear(hidden_size, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        output, _ = self.lstm(x)
        last_step = output[:, -1, :]
        return self.head(last_step)


class LSTMModel:
    def __init__(self) -> None:
        self.model: LSTMClassifier | None = None
        self.model_version: str = settings.model_version_lstm
        self.min_sequence_length = settings.lstm_min_sequence_length

    def load(self) -> None:
        model_path = Path(settings.model_path_lstm)
        model = LSTMClassifier()
        state_dict = torch.load(model_path, map_location="cpu")
        model.load_state_dict(state_dict)
        model.eval()
        self.model = model
        logger.info("LSTM model loaded from %s", model_path)

    def unload(self) -> None:
        self.model = None

    def predict_score(self, event_sequence: list[float]) -> float | None:
        if self.model is None:
            raise RuntimeError("LSTM model is not loaded")

        if len(event_sequence) < self.min_sequence_length:
            return None

        seq_tensor = torch.tensor(event_sequence, dtype=torch.float32).view(1, -1, 1)
        with torch.no_grad():
            logit = self.model(seq_tensor).item()
        return float(torch.sigmoid(torch.tensor(logit)).item())
