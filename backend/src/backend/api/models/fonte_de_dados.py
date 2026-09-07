from tortoise import fields, models
from tortoise.migrations.constraints import UniqueConstraint

class FonteDeDados(models.Model):
    id = fields.IntField(primary_key=True)
    nome = fields.CharField(max_length=100)
    descricao = fields.TextField()
    data_criacao = fields.DatetimeField(auto_now_add=True)
    data_atualizacao = fields.DatetimeField(auto_now=True)

    usuario = fields.ForeignKeyField(
        'models.Usuario', 
        related_name='fontes_de_dados', 
        on_delete=fields.CASCADE
    )

    class Meta:
        table = 'fontes_de_dados'
        constraints = [
            UniqueConstraint(('nome', 'usuario_id'), name='uid_nome_usuario')
        ]